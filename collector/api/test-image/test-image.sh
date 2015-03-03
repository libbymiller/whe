#!/bin/bash

number=$RANDOM
let "number %= 2"
dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

curl http://127.0.0.1:3000/image -F my_file=@"$dir/image$number.jpg" -F "name=1423085821" -F "source=moz$number"