# starts the container with the name of the current directory


PWD=$(pwd)
REPO=$(basename $(pwd)) # get the name of the current directory
# if no argument is passed, start the container with the name of the current directory

if [ $# -eq 0 ]; then
  NAME=$(basename $PWD)
else
  NAME=$1
fi

docker run -d \
  --name $NAME \
  --network=host \
  --restart unless-stopped \
  --privileged --shm-size 4g \
  -v $PWD:/app \
  -v /root/.{$REPO}:/root/.{$REPO} \
  -v /var/run/docker.sock:/var/run/docker.sock \
  $REPO

CONTAINER_ID=$(docker ps -q -f name=$NAME)
echo "STARTING(name=$NAME repo=$REPO container=$CONTAINER_ID)"



# Path: run/stop.sh