#!/bin/bash

declare -A tags

for feature in `find -iname *.feature`
do
    tag=`head -n 1 $feature | sed -E s/\\\\s+.*//`
    tags[$tag]=$tag
done

tags_json="["

for tag in "${tags[@]}"
do
    tags_json+="\"$tag\","
done

tags_json="${tags_json%?}"
tags_json+="]"

echo $tags_json
