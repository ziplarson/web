#!/bin/bash

BASE_DIR=`dirname $0`;

echo ""
echo "Starting Karma Server (http://karma-runner.github.io) BASE_DIR=$BASE_DIR"
echo "-------------------------------------------------------------------"

karma start $BASE_DIR/../config/karma.conf.js $*