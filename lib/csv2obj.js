var csv = require('fast-csv');

/*
	stream - readable stream created by fs.createReadStream or string
    cb - function (err, rows)
    	rows - [{
    		"Date" : string,
			"Close" : number,
			"High" : number,
			"Low" : number,
			"Open" : number,
			"Volume" : number
    		}, 
    		...
    	]
*/
exports.csvToRows = function (stream, cb){
	var rows = [];
	var csvstream = (typeof stream == "string") ?
		csv.fromString(stream, {headers:true})
		: csv.fromStream(stream, {headers:true});

	csvstream.transform(function (data){
		return {
			"Date" : data["Date"],
			"Close" : Number(data["Close"]),
			"High" : Number(data["High"]),
			"Low" : Number(data["Low"]),
			"Open" : Number(data["Open"]),
			"Volume" : parseInt(data["Volume"])
		}
	})
	.on('data', function (data){
		rows.push(data);
	})
	.on('end', function (){
		cb && cb(rows.sort(function (a, b){
			return a.Date > b.Date;
		}));
	});
}

/*
	rows - [{
		"Date" : string,
		"Close" : number,
		"High" : number,
		"Low" : number,
		"Open" : number,
		"Volume" : number
		}, 
		...
	]
	writeable_stream - writeable stream created by fs.createWriteStream
*/
exports.rowsToCsvStream = function (rows, writeable_stream){
	var csvStream = csv.createWriteStream({headers: true});
	csvStream.pipe(writeable_stream);

	rows.forEach(function (row){
		csvStream.write(row);
	});

	csvStream.end();
}