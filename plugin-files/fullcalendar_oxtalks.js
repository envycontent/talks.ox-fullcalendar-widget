/*!
 * FullCalendar v1.6.4 Oxford Talks Plugin
 * This plug-in extends the FullCalendar jQuery plugin to allow it to be easily
 * configured for use with an Oxford talks feed.
 * To configure simply add a source with an address in the format of:
 * 	talks.ox.ac.uk/show/
 * The plug-in will automatically convert the URL to retrieve the appropriate JSONP
 * and display the details on the calendar.
 * (c) 2013 David Hickman
 */
 
(function($) {

//"constants" used when calculating links to OxTalks
var OX_TALKS_MATCHING_URL_REGEXP = /^(http|https):\/\/talks.ox.ac.uk\/show\/.+\//;
var OX_TALKS_REPLACE_URL_REGEXP = /:\/\/talks.ox.ac.uk\/show\/.+\//;
var OX_TALKS_JSON_LIST_ADDRESS = '://talks.ox.ac.uk/show/json/';
var FULLCAL_JSONP_CALLBACK_SUFFIX = '?callback=?';

var OX_TALKS_TALK_DETAIL_ADDRESS = 'https://talks.ox.ac.uk/talk/index/'


//helper function for debugging
function writeDebugMessage(msg) {
	/*if('undefined' !== typeof console && console.log) {
		console.log(msg);
	}*/
}

//helper function to replace any given oxtalks address with the correct address
//to load the JSON information for the talk list
//(http or https specification from the original URL is preserved)
function getJSONPOxTalkURL(originalURL) {
	return originalURL.replace(OX_TALKS_REPLACE_URL_REGEXP, OX_TALKS_JSON_LIST_ADDRESS) +
		FULLCAL_JSONP_CALLBACK_SUFFIX;
}

//helper function to create a link to an oxtalks individual talk page
function generateTalkURLFromID(talkID) {
	return OX_TALKS_TALK_DETAIL_ADDRESS + talkID;
}


//get FullCalendar related variables
var fc = $.fullCalendar;


//Add a new "sourceNormalizer" for event sources that include the talks.ox.ac.uk/show address
//this will allow the FullCalendar to retrieve information about oxtalks feeds in a different way
//to a standard JSON feed.
//Note that we register any format of talks.ox.ac.uk address as compatible (HTML, JSON etc)
//as the URL is modified in the sourcefetcher if required.
fc.sourceNormalizers.push(function(sourceOptions) {
	if (sourceOptions.dataType == 'oxtalks' ||
		sourceOptions.dataType === undefined &&
		(sourceOptions.url || '').match(/^(http|https):\/\/talks.ox.ac.uk\/show\//)) {
			sourceOptions.dataType = 'oxtalks';
			//ensure that these event types cannot be modified
			if (sourceOptions.editable === undefined) {
				sourceOptions.editable = false;
			}
		}
});


//Add a new "sourceFetcher" to return the FullCalendar compatible data for the oxtalks data type.
//"Source Fetchers" seem to be an array of functions that are called in
//sequence to see if they can return data about a given source
//data type.
fc.sourceFetchers.push(function(sourceOptions, start, end) {
	if (sourceOptions.dataType == 'oxtalks') {
		return transformOxtalksOptions(sourceOptions, start, end);
	}
});


function transformOxtalksOptions(sourceOptions, start, end) {

	//function used to convert a date to a unix timestamp for use with the start_time
	//or end_time parameters in the oxtalks json request string
	function getUnixTimeStamp(datetimevar) {
		writeDebugMessage('>> Getting Unix Timestamp for DateTime: ' + datetimevar);
		
		//if there is a valid datetimevar object then convert it (or use it)
		//otherwise just return the current date
		var newDate;
		if (datetimevar)
		{
			//if this variable is a date then we can use it directly
			if (datetimevar instanceof Date)
			{
				newDate = datetimevar;
			}
			else
			{
				newDate =  new Date(datetimevar);
			}
		}
		else
		{
			newDate = new Date();
		}
		
		writeDebugMessage('>> Date object for Unix Timestamp: ' + newDate);
		
		//note: javascript getTime() returns number of millis since 1970-01-01
		//but oxTalks expects seconds so we must divide by 1000
		return parseInt((newDate.getTime())/1000);
	}
	
	var success = sourceOptions.success;
	
	//Get the talk ID and the URL that can access the JSON feed of this data
	//ensuring that the callback parameter is included so that the data can be
	//retrieved using JSONP
	//(the talk ID is always the last part of the URL)
	var talkListURL = getJSONPOxTalkURL(sourceOptions.url);
	writeDebugMessage('Will load OxTalks data from: ' + talkListURL);
	
	//Check the data that is going to be passed in the query string when
	//retrieving the Oxford talks feed - if there are "start_datetime" or
	//"end_datetime" parameters then update these as necessary
	if(sourceOptions.data && (!(sourceOptions.data.x_start_datetime === undefined) || !(sourceOptions.data.x_end_datetime === undefined)))
	{
		writeDebugMessage('> Start datetime or end datetime found - modifying data object.');
		var newDataObj = {};
		$.each(sourceOptions.data, function(key, element) {
			
			switch(key)
			{
				//if the user has used start_datetime or end_datetime then convert these to the appropriate values
				case 'x_start_datetime':
					newDataObj.start_time = getUnixTimeStamp(element);
					break;
				case 'x_end_datetime':
					newDataObj.end_time = getUnixTimeStamp(element);
					break;
					
				//if the user also used a matching start_time or end_time then these must be ignored
				//(note: they are only ignored if there is a matching datetime, otherwise they are still added)
				case 'start_time':
					if(!sourceOptions.data.x_start_datetime)
					{
						newDataObj[key] = element;
					}
					break;
				case 'end_time':
					if(!sourceOptions.data.x_end_datetime)
					{
						newDataObj[key] = element;
					}
					break;
				
				//all other properties are simply copied across
				default:
					newDataObj[key] = element;
			}
		});
		
		writeDebugMessage('> New data object created:');
		writeDebugMessage(newDataObj);
		
		//merge the data object back into the original sourceData object
		sourceOptions.data = newDataObj;
	}
	
	//ensure that all options are set and return the option detials
	return $.extend({}, sourceOptions, {
		url: talkListURL,
		type: 'GET',
		dataType: 'jsonp',
		startParam: false,
		endParam: false,
		error: function(requestObj, errorString, errorDetails) {
            //write debugging information if javascript console (chrome, firebug etc) is enabled
			writeDebugMessage('There was an error while fetching events from OxTalks: ' + errorDetails.message);
			writeDebugMessage(requestObj);
			writeDebugMessage(errorDetails);
        },
		success: function(data) {
			
			var events = [];
			
			//if there is an array of data then go through each, convert it and add
			//it to the event array
			if(data && data.length && data.length > 0)
			{
				$.each(data, function(index, eventData) {
					events.push({
						id: eventData.id,
						start: eventData.start_time,
						end: eventData.end_time,
						title: eventData.title,
						url: generateTalkURLFromID(eventData.id),
						allDay: false
					})
				});
			}
			
			//return the completed list of events
			return events;
		}
	});
	
}

})(jQuery);
