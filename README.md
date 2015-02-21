# whe

There are two types of devices in the project, `collectors` and `emitters`.

Installation
--

    git clone <repo url>
    cd whe
    npm install

Running
--

To run a collector:

    foreman start -p 3000 -f collector/Procfile

To run an emitter:

    foreman start -p 4000 -f emitter/Procfile

Start on specific ports since that's in the config.