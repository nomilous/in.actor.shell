# in.actor.shell

Shell actor for [in.](https://github.com/nomilous/in.)

#### It injects the result of a shell call into the argument

```javascript
$$in(function(ping) { // in. shell ping -c1 www.example.com
  /* ping */
})
```

#### It is aliased as __$__

```javascript
$$in(function(uptime) { // in. $ uptime
  /* uptime */
})
```

#### It can provide stderr instead of stdout into the argument

```javascript
$$in(function(echoed) { // in. $ in.as.stderr $ echo message to stderr >&2
  /* echoed */
})
```

#### It can provide the raw buffer object

```javascript
$$in(function(buff) { // in. $ in.as.buffer $ cat file
  /* buff */
})
```

#### It can provide a data event stream

```javascript
$$in(function(netcat) { // in.as.stream $ nc -kl 3000
  // netcat.on('error', ...
  netcat.on('data', ...
  // netcat.on('end', ...
  // echo moo | nc localhost 3000
})
```

#### It can provide lines

```javascript
$$in(function(
  files, // in. {{ $$files('/var/log/*.log') }}
  logs  // in.as.stream.lines $ tail -F {{files}}
){
  files.forEach(function(logFile) {
    var log = logs.shift();
    // log.on('error', ...
    log.on('data', function(line) {
      logFile;
      line;
    });
  });
})
```
