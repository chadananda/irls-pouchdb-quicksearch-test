$(document).ready(function(){

  var dbadapter = {adapter : 'memory'};  // idb-alt  websql memory
  var db = new PouchDB('sentences', dbadapter);
  destroyDB();

  var lunr_index = lunr(function () {
    this.field('text', {boost: 10}),
    this.ref('index')
  });

  $("input[name=optionsDBengine]").click(function(event) {
    var newAdapter = $("input[name=optionsDBengine]:checked").val();
    if (newAdapter != db.adapter) {
      dbadapter = {adapter : newAdapter};
      destroyDB();
    }
    return false;
  });

	$("#pouchbut").click(function(event) {
		var filename = $("input[name=optionsRadios]:checked").val();
		var start = new Date();
		if (filename){
			logit("Creating PouchDB database, using '"+db.adapter+"' database...");
			bulkInsert(filename);
		} else {
			alert("Select JSON first!");
		}
		function bulkInsert(filename){
      logit('Loading file "'+filename+'"...');
			$.getJSON('resDocs/' + filename, function( data ) {
        logit('Loaded file "'+filename+'", importing '+data.length+' documents to database...');
				db.bulkDocs(data, function(err, response) {
					if(!err){
						logit('Imported '+data.length+' records in ' + ( (new Date() - start)/1000 ) + ' seconds.');
					}
          else logit(err, 'error');
				});
			});
		}
    return false;
  });

  $("#destroy").click(function(event) {
  	logit("Deleting database...");
  	var start = new Date();
		PouchDB.destroy('sentences', function(err, info) {
			if(!err){
				db = new PouchDB('sentences', dbadapter);
				logit("Deleted database -- in " + ( (new Date() - start) ) + " ms.");
			}
			else logit(err, 'error');
		});
    return false;
  });

  /**************************************************************/
  // PouchDB Quicksearch
  /**************************************************************/

  $("#buildbut").click(function(event) {
  	logit("Building PouchDB QuickSearch index...");
  	var start = new Date();
  	db.search({
  	  fields: ['text'],
  	  build: true
		}).then(function (info) {
			console.log('callback BI');
		  	if (info.ok){
		  		logit("Index build complete -- in " + ( (new Date() - start)/1000 ) + " seconds.");
		  	}
		});
    return false;
  });

  $("#indexdestroy").click(function(event) {
  	logit("Deleting index. Please Wait...");
  	var start = new Date();
  	db.search({
	  fields: ['text'],
	  destroy: true
		}).then(function (info) {
			console.log('callback BI');
		  	if (info.ok){
		  		logit("Index deleted -- in " + ( (new Date() - start) ) + " ms.");
		  	}
		});
    return false;
  });

  $("#searchbut").click(function(event) {
  	var search_query = $("#inputval").val();
  	if (search_query.length > 0){
    	var start = new Date();
    	logit("Search with lunr.js for '" + search_query + "'...");
			db.search({
			  query: search_query,
			  fields: ['text'],
			  include_docs: false
			}).then(function (res) {
				console.log(JSON.stringify(res));
				logit("Total " + res.rows.length + " results -- in " + ( (new Date() - start)/1000 ) + " seconds.");
			});
  	}
    return false;
  });

  /**************************************************************/
  // Lunr.js
  /**************************************************************/

  $("#buildbut2").click(function(event) {
    logit('Fetching all docs from DB');
    db.allDocs({include_docs: true, descending: false}, function(err, doc) {
      if (!err) {
        logit("Building lunr.js index of "+doc.rows.length+ ' documents.');
        console.log('Got all docs...');
        var start = new Date();
        doc.rows.forEach(function(obj, index){
          //if (((new Date() - start)/1000)))
          lunr_index.add({
            index: obj.doc.index.toString(36),
            text: obj.doc.text
          });
        });
        logit("Lunr.js indexing done in " + ((new Date() - start)/1000) + " seconds. Index Size: "+
         formatByteSize(roughSizeOfObject(lunr_index)));

        start = new Date();
        var serializedIndex = JSON.stringify(lunr_index.toJSON());
        var deserializedIndex = JSON.parse(serializedIndex);
        var index2 = lunr.Index.load(deserializedIndex);
        logit("Index was serialized then deserialized in " + ( (new Date() - start) ) + " ms.");

      }
      else logit(err, 'error');
    });
    return false;
  });

  $("#indexdestroy2").click(function(event) {
    logit("Deleting lunr.js index...");
    var start = new Date();
    lunr_index = lunr(function () {
      this.field('text', {boost: 10})
      this.ref('id')
    });
    logit("Lunr.js index deleted -- in " + ( (new Date() - start) ) + " ms.");
    return false;
  });

  $("#searchbut2").click(function(event) {
    var search_query = $("#inputval2").val();
    if (search_query.length > 0){
      var start = new Date();
      logit("Searching Lunr.js index for phrase '" + search_query + "'...");
      var results = lunr_index.search(search_query);
      logit(" Lunr.js search returned "+results.length+" results in " + ( (new Date() - start) ) + " ms.");
      //logit('<pre>' + JSON.stringify(results) + '</pre>');
    }
    return false;
  });

  /**************************************************************/
  // utilities
  /**************************************************************/

  function formatByteSize(bytes) {
    if(bytes < 1024) return bytes + " bytes";
    else if(bytes < 1048576) return(bytes / 1024).toFixed(3) + " KiB";
    else if(bytes < 1073741824) return(bytes / 1048576).toFixed(3) + " MiB";
    else return(bytes / 1073741824).toFixed(3) + " GiB";
  }

  function destroyDB() {
    PouchDB.destroy('sentences', function(err, info) {
      if(!err){
        db = new PouchDB('sentences', dbadapter);
        logit('Database dropped and re-created using adapter "'+db.adapter+'"');
      }
      else logit(err, 'error');
    });
  }

  function logit(str, msg_class) {
    var t = new Date();
    var msg = "<li class='msg'><span class='dt'>["+t.toLocaleTimeString()+"]</span> <span class='"+msg_class+"'>"+str+"</span></li>";
    $("#log").prepend(msg);
  }

  function roughSizeOfObject( object ) {
    var objectList = [];
    var stack = [ object ];
    var bytes = 0;
    while ( stack.length ) {
        var value = stack.pop();

        if ( typeof value === 'boolean' ) {
            bytes += 4;
        }
        else if ( typeof value === 'string' ) {
            bytes += value.length * 2;
        }
        else if ( typeof value === 'number' ) {
            bytes += 8;
        }
        else if
        (
            typeof value === 'object'
            && objectList.indexOf( value ) === -1
        )
        {
            objectList.push( value );

            for( var i in value ) {
                stack.push( value[ i ] );
            }
        }
      }
      return bytes;
    }



});



