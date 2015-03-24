Except where otherwise noted, license is Apache 2 (see LICENSE in this directory)

# whe

There are two types of devices in the project, `collectors` and `emitters`.

Local installation and running
--

To run locally:

    git clone <repo url>
    cd whe
    npm install

Configuration for all applications is in `shared/config.json`.

To run a collector:

    foreman start -p 3000 -f collector/Procfile

To run an emitter:

    foreman start -f emitter/Procfile

Start on specific ports since that's in the config.

Gallery installation
---

To install as a gallery installation on multiple Raspberry Pis, see [INSTALL.md](INSTALL.md).

[supervisord](http://supervisord.org/) will manage start-up of all processes. Processes will be restarted when they crash.

Logs are in `/var/log/supervisor/`.

See the `status` of all managed processes:

    pi@collector ~ $ sudo supervisorctl status
    collector                        RUNNING    pid 3035, uptime 0:02:58
    printer                          RUNNING    pid 3034, uptime 0:02:58

Stop a running process:

    pi@collector ~ $ sudo supervisorctl stop collector
    collector: stopped

Start a process:

    pi@collector ~ $ sudo supervisorctl start collector
    collector: started
