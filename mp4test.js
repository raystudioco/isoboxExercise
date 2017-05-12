


function mp4(){


	this.boxes=[];
	this.parse_idx=0;
	this.size=0;
	this.idx=0;
	this.type="root";
	this.buffer=null;

	//load file
	//url: URL of the file to load
	//callback: callback function to parse the loaded buffer
	this.load = function (url, callback) {
		
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url);
		xhr.responseType="arraybuffer";
		

		xhr.onload = function (xEvnet) {
			
			var arrayBuffer =  xhr.response;

			if(arrayBuffer){

				var byte = new Uint8Array(arrayBuffer);

				//callbackk with the result
				console.log("File - "+url+" - loaded");

				callback(byte);

			}
		}
		xhr.send(null);
	}

	//parse structure
	//byte:  input byte as buffer
	this.parse = function (buffer) {

		this.size= buffer.length;
	 //   debug code for checking content binary
	 //   for (var i = 0; i < 10; i++) {	    	
	 //  	console.log( '['+('0'+(buffer[i]& 0xFF).toString(16)).slice(-2)+']');
	 //  }
	  	this.buffer=buffer;

	  	//assume there is sub box with root structure
	  	this.parseSubBox(this);


	}


	// recursive structure for parsing boxes
	// perform a deep priority search
	// check both sub box, and other box in the same parent box.
	// _parentBox: parentBox of the current box being parsed
	// _box: current box going to be parsed.
	this.parseBox = function(_parentBox, _box){

		// check for sub box 
		// deep priority search
		if(this.hasSubBox(_box)){

			this.parseSubBox(_box);

		}

		//check of other box in the samne parent box
		if(this.hasNextBox(_parentBox, _box)){

			var nextBox = new box(this.buffer, _box.idx+_box.size)
			//add next box to the structure

			_parentBox.boxes.push(nextBox);

			this.parseBox(_parentBox,nextBox);


		}

		//display the content
		if(_box.type=="mdat"){
		
			this.extractMdat(_box);
		}

	}

	// Parse sub box under the current box
	// _box: box to be parsed for sub box
	this.parseSubBox = function(_box){

		//get sub box;

		var offset=0;
		if(_box.type!="root"){
			//assume the data (sub box), start after 8 bytes
			//4 byte size, 4 byte type
			offset =8;
		}	

		var subBox = new box(this.buffer,_box.idx+offset);

		//add sub box to the structure
		_box.boxes.push(subBox);

		//parse to see if there's next boxes
		this.parseBox(_box, subBox);

	}

	// check box type to see if there will be sub Box or not.
	// Todo: other criteria to be considered?
	// _box: the current box to be checked if there's sub box inside
	this.hasSubBox = function(_box){
		
		if(_box.type=="moof" || _box.type=="traf"){ 
		//currently assume only these 2 type has sub box
			return true;
		} else {
			return false;
		}

	}


	// check if there're other box in the same parent box
	// the checking is using a length based logic
	// The assumption is that if there's data/conten, it should be contained with box
	// parentBox: parent box where current box is under
	// currentBox: current box to be checked if there's next box.
	this.hasNextBox = function(parentBox, currentBox){

		//length based calculation, see if there's space for data/content (other box)
		if(parentBox.size+parentBox.idx-currentBox.idx-currentBox.size>0){
			return true;
		} else 
			return false;

	}

	// extract and display the mdatbox content
	//_mdatBox: mdat box having xml and img content
	this.extractMdat = function(_mdatBox){

		//todo error handling

		//extract xml string from  buffer
		var xmlstr="";

		console.log("Content from MDAT : ");

		//implentation for sending a chunk of text to console
		var displayStrChunk="";
		var charCount=0;
		var charMax = 512;
		var totalLength=0
		for (var i = 0; i < _mdatBox.size-8; i++) {
	    	var currentChar =String.fromCharCode(this.buffer[i+8+_mdatBox.idx]);
	    	xmlstr+= currentChar
	    	displayStrChunk+=currentChar;
	    	charCount++;
	    	if(charCount+1>charMax || i+1==_mdatBox.size-8){
	    		//console.log(displayStrChunk.length);
	    		//totalLength+=displayStrChunk.length;

	    		console.log(displayStrChunk);
	    		charCount=0;
	    		displayStrChunk="";
	    	}
	    }

	    //size verify
		//console.log(xmlstr.length);
		//console.log(totalLength);

		//display content
	    //console.log(xmlstr);

	    parseXMLandDisplayImage(xmlstr);


	}

}

//buf: input buffer
//buf_idx: the starting index of the box in the buffer.
function box(buf,buf_idx){
	this.size = 0;
	this.type = "";
	this.idx = buf_idx;
	this.boxes=[];

	this.parse=function(_buf){

		//get type
		var _size = 0;

		//todo error handling.

		for (var i = 0; i < 4; i++) {	    	
	    	_size=_size<<8
	    	_size+=_buf[i+buf_idx];
	    }

	    this.size = _size;

		//get type
		var _type = "";

		for (var i = 0; i < 4; i++) {
	    	
	    	_type+=String.fromCharCode(_buf[i+4+buf_idx]);
	    }

	    this.type = _type;

	}

	this.parse(buf);

	console.log("found box type : "+this.type+", size : "+this.size);
	

}


//Parse XML and display Image in the string.
//xmlstring: input XML string
function parseXMLandDisplayImage(xmlstring){

	//parse XML
	//console.log('parseXML');
	parser = new DOMParser();
	xmlDoc = parser.parseFromString(xmlstring,"text/xml");
	//console.log(xmlDoc);
	//get the image elements
	var images = xmlDoc.getElementsByTagName("smpte:image");
	
	if(images.length==0){
		//can't find image for some reason on chrome.
		images = xmlDoc.getElementsByTagName("image");

	}
	//console.log(images);
	//insert the image to the DOM
	var resultImageDiv=document.getElementById("xmldisplay");
	var imageAttribute="";

	for (var i=0;i<images.length;i++){

		var b64imageString = images[i].childNodes[0].nodeValue;
		imageAttribute = 'data:image/png;base64,'+b64imageString;
		var imageElement = document.createElement('img');
		imageElement.setAttribute('src', imageAttribute);

		resultImageDiv.appendChild(imageElement);

	}

}



window.onload = function() {

	var mp4obj = new mp4();
	mp4obj.load("http://demo.castlabs.com/tmp//text0.mp4",
		function(buf){

			mp4obj.parse(buf);

			//display the structure for verfication
			console.log(mp4obj);
		}
	);


};




