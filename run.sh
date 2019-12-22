#!/bin/bash
if [ "$1" = "build" ]; then
    docker build --tag="lion" .
fi

if [ "$1" = "kill" ]; then
    docker container stop $(docker container ls -q)
fi

if [ "$1" = "run" ]; then
    docker run lion:latest
fi

if [ "$1" = "all" ]; then
    sh run.sh build
    sh run.sh kill
    sh run.sh run
fi
