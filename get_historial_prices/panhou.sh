#!/bin/sh

# DATA BASE PATH
HISTORY_PATH=`node read_config.js historial_prices_path`

if [ ! -d $HISTORY_PATH ]; then
	echo "FATAL: PATH ${HISTORY_PATH} NOT EXISTS."
	exit 1
fi

# ALL STOCK LIST
STOCK_LIST_FILE=`node read_config.js stockcodes`
if [ ! -f $STOCK_LIST_FILE ]; then
	echo "FATAL: PATH ${STOCK_LIST_FILE} NOT EXISTS."
	exit 1
fi

# GET OPTION CONFIG INFOMATIONS
DAY_PATH=`node read_config.js day`
IGNORE_PATH=`node read_config.js ignore`
TASK_PATH=`node read_config.js tasks`
LAST_UPDATE_FILE=`node read_config.js last_update`

# RUN ENV
START_PWD=$PWD

# GO INTO DATA PATH
cd ${HISTORY_PATH}

if [ ! -d $DAY_PATH ]; then
	echo "mkdir ${DAY_PATH}"
	mkdir $DAY_PATH
fi

if [ ! -d $IGNORE_PATH ]; then
	echo "mkdir ${IGNORE_PATH}"
	mkdir $IGNORE_PATH
fi

if [ ! -d $TASK_PATH ]; then
	echo "mkdir ${TASK_PATH}"
	mkdir $TASK_PATH
fi

if [ ! -f $LAST_UPDATE_FILE ]; then
	echo "create ${LAST_UPDATE_FILE}"
	echo "2014-01-01" > $LAST_UPDATE_FILE
fi

cd ${START_PWD}

# RUN COLLECTION
node get_prices.js