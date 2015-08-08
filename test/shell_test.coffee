objective 'Shell actor', (should) ->

    trace.filter = true

    beforeEach ->

        @opts = 
            $$caller:
                FileName: __filename
        @inArgs = {}
        @actionArgs =
            action: ['in', 'as']
            adapters: []
            expansion: 'command -arg'

    context 'in.as', ->

        it 'calls spawn with expansion',

            (done, child_process, path, Shell) ->

                child_process.does spawn: (command, args, opts)->

                    command.should.equal '/bin/sh'
                    args.should.eql ['-c', 'command -arg']
                    # opts.cwd.should.eql path.dirname __filename
                    done()

                    stdout: on: ->
                    stderr: on: ->
                    on: ->

                Shell @opts, @inArgs, @actionArgs
                .catch done

        it 'calls Shell.inAsBuffered',

            (done, child_process, Shell) ->

                child_process.does spawn: -> {}
                Shell.does inAsBuffered: -> done()

                Shell @opts, @inArgs, @actionArgs


    context 'in.as.stream', ->

        it 'calls Shell.inAsBuffered',

            (done, child_process, Shell) ->

                @actionArgs.adapters = ['stream']

                child_process.does spawn: -> {}
                Shell.does inAsStream: -> done()

                Shell @opts, @inArgs, @actionArgs



    context 'in.do', ->

    context 'out.', ->

