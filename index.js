shell = require('./lib/shell'); 

if (typeof $$in !== 'undefined') {
  $$in.actors.shell = shell;
  $$in.actorAliases['$'] = 'shell';
}
