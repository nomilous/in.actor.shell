module.exports = Shell;

// TODO: option.timeout

path = require('path');
child_process = require('child_process');
promise = require('when').promise;
EventEmitter = require('events').EventEmitter;

function ShellError(msg, errno) {
  var e = new Error(msg);
  e.name = 'ShellError';
  e.errno = errno;
  return e;
}

function Shell(opts, inArgs, actionArg, actorPath) {
  
  var shell, args, options, child;
  var cmd = actionArg.expansion;
  var action = actionArg.action;
  var adapters = actionArg.adapters;
  var stream = adapters[0] == 'stream';

  if (action[0] == 'out') return actionArg;

  options = util._extend({}, opts);
  options.encoding = Buffer.isEncoding(options.encoding) ? options.encoding : 'utf8';
  options.cwd = (options.cwd || path.dirname(opts.$$caller.FileName));

  // options.env = (options.env || undefined);
  // options.uid = (options.uid || undefined);
  // options.gid = (options.gid || undefined);

  if (process.platform == 'win32') {
    shell = process.env.comspec || options.shell || 'cmd.exe';
    args = ['/s', '/c', '"' + cmd + '"'];
    options.windowsVerbatimArguments = true;
  } else {
    shell = options.shell || '/bin/sh';
    args = ['-c', cmd];
  }

  child = child_process.spawn(shell, args, options);
  child.cmd = shell + ' ' + args.join(' ');
  if (stream) return Shell.inAsStream(child, options, actionArg);
  return Shell.inAsBuffered(child, options, actionArg);

}

Shell.$$can = function(action) {
  if (action.action[0] == 'out') return false; // temporary
  // if (action.adapters.indexOf('stream') >= 0) return false; // temporary
  return true;
}

Shell.inAsBuffered = function(child, options, actionArg) {
  return promise(function(resolve, reject, notify) {

    var stdoutBuffer, stderrBuffer;
    var lastStderr;
    var raw = actionArg.adapters.indexOf('buffer') >= 0;

    if (raw) {
      stdoutBuffer = [];
      stderrBuffer = [];
    } else {
      stdoutBuffer = '';
      stderrBuffer = '';
    }

    var exithandler = function(code, signal, err) {
      if (code !== 0 || err) {
        if (err) {
          lastStderr = err.toString();
          code = err.errno || 1;
        } 
        else if (!lastStderr || lastStderr == '')  {
          lastStderr = 'shell exited with non zero for ' + child.cmd;
        }
        // TODO: sometimes error is valid/expected result
        return reject(
          new $$in.InfusionError(lastStderr, {errno: code, cmd: child.cmd})
        );
      }

      if (actionArg.adapters.indexOf('stderr') >= 0) {
        if (raw) actionArg.value = Buffer.concat(stderrBuffer);
        else actionArg.value = stderrBuffer;
        return resolve(actionArg);
      }

      if (raw) actionArg.value = Buffer.concat(stdoutBuffer);
      else actionArg.value = stdoutBuffer;
      return resolve(actionArg);
    }

    child.stdout.on('data', function(chunk) {
      lastStderr = '';
      if (raw) {
        stdoutBuffer.push(chunk);
        return;
      }
      stdoutBuffer += chunk.toString(options.encoding);
    });

    child.stderr.on('data', function(chunk) {
      lastStderr = chunk.toString(options.encoding);
      if (raw) {
        stderrBuffer.push(chunk);
        return;
      }
      stderrBuffer += lastStderr;
    });

    child.on('close', exithandler);

    child.on('error', function(e) {
      exithandler(null, null, e);
    });

  });
}


Shell.inAsStream = function(child, options, actionArg) {
  return promise(function(resolve, reject, notify) {

    var lastStderr;
    var stderr = actionArg.adapters.indexOf('stderr') >= 0;
    var raw = actionArg.adapters.indexOf('buffer') >= 0;
    var emitter = new EventEmitter();

    actionArg.value = emitter;
    resolve(actionArg);

    var exithandler = function(code, signal, err) {
      if (code > 0 || err) {
        if (err) {
          lastStderr = err.toString();
          code = err.errno || 1;
        } else if (!lastStderr || lastStderr == '')  {
          lastStderr = 'shell exited with non zero for ' + child.cmd;
        }
        var e = new $$in.InfusionError(lastStderr, {errno: code, cmd: child.cmd});
        if (emitter.listeners('error').length > 0) emitter.emit('error', e)
        else console.error(e.toString());
      }
    }

    child.on('close', exithandler);
    child.on('error', function(e) {
      exithandler(null, null, e);
    });
    
    child.stderr.on('data', function(chunk) {
      lastStderr = chunk.toString(options.encoding);
      if (!stderr) return;
      if (raw) return emitter.emit('data', chunk);
      emitter.emit('data', chunk.toString(options.encoding));
    });

    if (stderr) {
      child.stderr.on('error', function(e) {
        emitter.emit('error', e);
      });
      child.stderr.on('end', function() {
        emitter.emit('end');
      });
      return
    }

    child.stdout.on('data', function(chunk) {
      if (raw) return emitter.emit('data', chunk)
      emitter.emit('data', chunk.toString(options.encoding));
    });
    child.stdout.on('error', function(e) {
      emitter.emit('error', e);
    });
    child.stdout.on('end', function() {
      emitter.emit('end');
    });
  });
}
