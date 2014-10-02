$(document).ready(function(){
	var adapter = {adapter : 'websql'};
	var db = new PouchDB('sentences', adapter);

	$("#pouchbut").click(function(event) {
		var filename = $("input[name=optionsRadios]:checked").val();
		var start = new Date();
		if (filename){
			$("<p>Start creating PouchDB database...</p>").prependTo( "#log" );
			bulkInsert(filename);
		} else {
			alert("Select JSON first!");
		}
		function bulkInsert(filename){
			$.getJSON( "resDocs/" + filename, function( data ) {
				db.bulkDocs(data, function(err, response) { 
					if(!err){
						$("<p>Done. Execution time " + ( (new Date() - start)/1000 ) + " seconds.</p>").prependTo( "#log" );
					}
				});
			});
		}

    });

    $("#destroy").click(function(event) {
    	$("<p>Deleting database. Please Wait...</p>").prependTo( "#log" );
    	var start = new Date();
		PouchDB.destroy('sentences', function(err, info) {
			if(!err){
				db = new PouchDB('sentences', adapter);
				$("<p>Deleting database done! Execution time " + ( (new Date() - start)/1000 ) + " seconds.</p>").prependTo( "#log" );
			}
			else {
				console.log(err);
			}
		});
    });

    $("#buildbut").click(function(event) {
    	$("<p>Start building PouchDBQuickSearch index...</p>").prependTo( "#log" );
    	var start = new Date();
    	db.search({
		  fields: ['text'],
		  build: true
		}).then(function (info) {
			console.log('callback BI');
		  	if (info.ok){
		  		$("<p>Index build complete! Execution time " + ( (new Date() - start)/1000 ) + " seconds.</p>").prependTo( "#log" );
		  	}
		});
    });

    $("#indexdestroy").click(function(event) {
    	$("<p>Deleting index. Please Wait...</p>").prependTo( "#log" );
    	var start = new Date();
    	db.search({
		  fields: ['text'],
		  destroy: true
		}).then(function (info) {
			console.log('callback BI');
		  	if (info.ok){
		  		$("<p>Index deleting done! Execution time " + ( (new Date() - start)/1000 ) + " seconds.</p>").prependTo( "#log" );
		  	}
		});
    });

    $("#searchbut").click(function(event) {
    	var search_query = $("#inputval").val();
    	if (search_query.length > 0){
	    	var start = new Date();
	    	$("<p>Started search '" + search_query + "'...</p>").prependTo( "#log" );
				db.search({
				  query: search_query,
				  fields: ['text'],
				  include_docs: false
				}).then(function (res) {
					console.log(JSON.stringify(res));
					$("<p>Total " + res.rows.length + " results. Execution time " + ( (new Date() - start)/1000 ) + " seconds.</p>").prependTo( "#log" );
				});
    	}
    });
});



