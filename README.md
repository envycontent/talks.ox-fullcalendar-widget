# talks.ox-fullcalendar-widget
Integration of Oxford Talks with FullCalendar

This widget integrates Oxford Talks with FullCalendar http://fullcalendar.io/ . The integration was very generously undertaken for the Oxford Talks project by David Hickman, University of Oxford.

There are two versions:

## Version 1 (released)

Integration of FullCalendar v 1 with the old version of Oxford Talks.

To install and test, place the Demo directory on your webserver or computer and view TestOxTalksPlugin.html in your browser.

You can adjust the Oxford Talks feeds shown by the calendar by changing the URLs in the eventsources section of the script tag in TestOxTalksPlugin.html.

Note: the JQuery and FullCalendar libraries are pulled in from Google apis and Cloudflare respectively. If you prefer you can download the relevant libraries and link to them locally.

### David Hickman's notes

It’s possible to supply any URL to an Oxford talks list page to the plug-in and it will automatically work out how to get the appropriate data.  This makes it really easy to just copy and paste the address of a talk list from the address bar of a browser and paste it into the plug-in configuration. Additionally the preference of using HTTP or HTTPS to retrieve the list will also be preserved which should be useful for secure sites.

The FullCalendar “data” can be used to specify any extra retrieval parameters for Oxford Talks like “limit” and “term”. Additionally two other extra parameters are included:

“x_start_datetime” and “x_end_datetime”. 

These parameters are designed to make it easier to restrict talks by start and end date/time and allow these to be specified as a string or as a JavaScript Date object which is then converted to the “seconds since the start of 1970” values that are required by the Oxford Talks web interface.

* Any strings passed in these are converted using standard JavaScript rules and so work best when the format is something like: yyyy-mm-dd
* It’s also possible to pass a null value in these arguments which will be interpreted as the current date and time.



## Version 2 (in development)

Integration of FullCalendar v 2 with the new Oxford Talks API.
