


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
			console.log("onload");
			var arrayBuffer =  xhr.response;

			if(arrayBuffer){

				var byte = new Uint8Array(arrayBuffer);

				//callbackk with the result

				callback(byte);

			}
		}
		xhr.send(null);
	}

	//parse structure
	//byte:  input byte as buffer
	this.parse = function (buffer) {

		this.size= buffer.length;
	 //   for (var i = 0; i < 10; i++) {
	    	
	  //  	console.log( '['+('0'+(buffer[i]& 0xFF).toString(16)).slice(-2)+']');

	  //  }
	  	this.buffer=buffer;

	  	this.parseSubBox(this);

	  	/*
		while(this.hasNext){

			parseBox(buffer,this.parse_idx);
			var _box=new box(buffer,this.parse_idx);




		}

		if(this.rootbox==null){

	  		this.rootbox = new box(buffer,0);



		}




		var rootBox = 
		console.log('Size:'+rootBox.size);
	 	console.log('Type:'+rootBox.type);
	 	*/
	}



	this.parseBox = function(_parentBox, _box){

		if(this.hasSubBox(_box)){

			this.parseSubBox(_box);

			//v add SubBox to box structure

		}

		if(this.hasNextBox(_parentBox, _box)){

			var nextBox = new box(this.buffer, _box.idx+_box.size)
			//add next box to the structure

			_parentBox.boxes.push(nextBox);

			this.parseBox(_parentBox,nextBox);


		}

		if(_box.type="mdat"){
			//display the content

			this.extractMdat(_box);
		}

	}


	this.parseSubBox = function(_box){

		//get sub box;
		var offset=0;
		if(_box.type!="root"){
			offset =8;
		}	

		var subBox = new box(this.buffer,_box.idx+offset);

		_box.boxes.push(subBox);
		//parse to see if there's next boxes
		this.parseBox(_box, subBox);

	}

	// check box type to see if there will be sub Box or not.
	// Todo: other criteria to be considered?
	this.hasSubBox = function(_box){
		
		if(_box.type=="moof" || _box.type=="traf"){ //todo: finish the logic

			return true;
		} else {
			return false;
		}

	}

	this.hasNextBox = function(parentBox, currentBox){

		if(parentBox.size+parentBox.idx-currentBox.idx-currentBox.size>0){
			return true;
		} else 
			return false;

	}

	this.extractMdat = function(_mdatBox){

		//todo error handling

		var xmlstr=""

		for (var i = 0; i < _mdatBox.size-8; i++) {
	    	
	    	xmlstr+=String.fromCharCode(this.buffer[i+8+_mdatBox.idx]);
	    }

	    //display the xml
	    console.log(xmlstr);


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




//Todos::
//v build structure
//display the result



window.onload = function() {

	var mp4obj = new mp4();
	mp4obj.load("http://demo.castlabs.com/tmp//text0.mp4",
		function(buf){

			mp4obj.parse(buf);


			console.log(mp4obj);
		}
	);


};




