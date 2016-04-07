/*
	code - eg. 600188 000536 ..
*/
exports.toYahooSymbol = function (code){
	switch (code[0]){
		case '6':
			return code + ".ss";
		case '0':
		case '3':
			return code + ".sz";
		default:
			return code;
	} 
}