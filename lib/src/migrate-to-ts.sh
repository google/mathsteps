#!/usr/bin/env bash

OLD_EXTENSION="js"
NEW_EXTENSION="ts"

for i in $(find `pwd` -name "*.${OLD_EXTENSION}");
do
    mv "$i" "${i%.$OLD_EXTENSION}.${NEW_EXTENSION}"
done
