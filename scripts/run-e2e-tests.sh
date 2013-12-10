#!/bin/bash

echo ""
echo "Starting e2e Tests"
echo "------------------"

./node_modules/protractor/bin/protractor ./config/protractor.js
