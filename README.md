Design for Literature
=====================

rk@designforliterature.com
rk@post.harvard.edu


HIRA Model RESTful web service and User Interface Reference Implementations
===========================================================================

This is a RESTful service implemented in node.js/express and an user interface
implemented in HTML5/CSS3/Javascript/Angularjs using MongoDB as a plugin database.

The reference model is used to guide and evaluate the HIRA spec. The first
draft version of HIRA will be published in the Spring of 2014.

Most of the features implemented here are still experimental and the system
is not intended to be used in production environments. However, it is available in this open
Github repository to provide transparency to and facilitate
communication with collaborators.

Notifications
=============

Notifications for clients are sent through the noteSocket websocket
and are objects with the following minimum fields:

 type := A string code indicating the severity and nature of the error.
 msg := A readable message indicating the specific error


Notification types:

fatal       A fatal server-side system error. The message is for debugging use only; clients
            should be given an appropriate, simple message. The message should be logged
            to the console to facilitate client-side debugging.

trans       A possibly transient server-side system error. The message is for debugging use only; clients
            should be told that they should try the operation again or later. The message should be logged
            to the console to facilitate client-side debugging.

error       An error for the client. The client should present the message as an error notification
            to the user who may need to take some corrective action. The message should be logged
            to the console to facilitate client-side debugging.

warn        A warning for the client. The client may present the message payload
            as a warning notification.

ack         An acknowledgement that a socket transaction or any other http request has succeeded.

note        A note for the client. The client may present the message as an
            informational notification.

Server-side Errors
==================

Thrown errors must have a type and msg field (as in notifications).
All errors of type 'fatal' and 'trans' must be caught and logged; all
other errors must be delivered to the client through the notification
or some other client-facing mechanism.

The try/catch mechanism should expect only error types 'fatal', 'trans' and 'error'.

Server-side Websocket Management
================================

Sockets are cached on a per-session basis to permit access
to them at any time. This allows us to use socket communications in any context.

Database
========

Values all stored as strings for now to simplify migration to other DBs
and to use DBs as plugins.

TODO
====
- Link to browse section when search result is selected.
- upload content
- implement libraries with permissions, users, catalogs and content copies, etc.
  libraries are distributed (library comm protocol)
- add publication date (day, month, year separately or partially)
- subject/keyword widget using typeahead for loosely constrained entries.
