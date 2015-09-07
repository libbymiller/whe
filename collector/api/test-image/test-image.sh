#!/bin/bash

number=$RANDOM
let "number %= 2"
dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

for number in 1 2 3 4 5 6
do
  curl http://127.0.0.1:5000/image -F my_file=@"$dir/image$number.jpg" -F "name=1423085821" -F "source=whe$number"
done
