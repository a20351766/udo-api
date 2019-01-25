#!/bin/bash

for i in `find ~/.forever -name "*.log"`; 
    do 
        cat /dev/null >$i; 
    done