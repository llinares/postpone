/*!
 * Postpone v0.5
 * Tool to manage a queue of tasks for browser-based apps.
 * Copyright (c) 2012 Leandro Linares
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 */
(function (window) {
	'use strict';

	/**
	 * Local cache for fastest access
	 */
	var storage = window.localStorage,
		Object = window.Object,
		Date = window.Date,
		JSON = window.JSON,
		postpone = {},
		head = window.document.getElementsByTagName('head')[0],
		script = window.document.createElement('script');

	/**
	 * Object that stores all the tasks with these execution date.
	 * @name set
	 * @memberOf postpone
	 * @type Object
	 * @example
	 * {
	 *     'Wed Sep 26 2012 17:00:00 GMT-0300 (ART)': 'function () { ... }';
	 * }
	 */
	postpone.queue = JSON.parse(storage.getItem('postponeQueue')) || {};

	/**
	 * Method that associates a task with the corresponding date string.
	 * @name set
	 * @methodOf postpone
	 * @param Number || String on Delay from "now" to use as key on the queue
	 * map. Expressed in minutes. Also, it can be a date string.
	 * @param Function callback Method to be saved into queue map to
	 * execute via key when the match with it task.
	 * @param Number [repeatAfter] Delay time, expressed in minutes, that
	 * determines when to execute a clone of the current task.
	 * @example
	 * postpone.set(30, function () {
	 *     console.log('Task to be executed in half an hour.');
	 * });
	 * @example
	 * postpone.set('2012/09/26 17:15', function () {
	 *     console.log('Task to be executed on September 26th.');
	 * });
	 * @example
	 * postpone.set('2012/12/03 22:00', function () {
	 *     console.log('Execute each hour from December 3rd at 10pm.');
	 * }, 60);
	 */
	postpone.set = function (on, callback, repeatAfter) {
		// Used to grab the "on" value when it's a number
		var delay,
			// The "callback" method as a string. It also contains the recursivity.
			method,
			// The "on" date as a string
			taskDateString;

		// When "on" is a delay value, count it from now
		if (typeof on === 'number') {
			// Grab the delay value apart
			delay = on;
			// Instance a date object of now
			on = new Date();
			// Count the delay from now
			on.setMinutes(on.getMinutes() + delay);
		// When "on" is just a date reference, transform into a Date instance
		} else {
			on = new Date(on);
		}

		// Convert "on" and "callback" to string
		taskDateString = on.toString();
		callback = callback.toString();

		// Start to concatenate the task method as a string
		method = 'function () {\n\t';
		// Define the callback as a private member to use more than once
		method += 'var callback = ' + callback + ';\n';
		// Execute the specified callback giving the task date as parameter
		method += 'callback(\'' + taskDateString + '\');\n';
		// Create a new cloned task by deliying the specified time of "repeatAfter"
		if (!!repeatAfter) {
			// Update the task date with the new delay
			on.setMinutes(on.getMinutes() + repeatAfter);
			// Set the same task with the new date and the same parameters
			method += 'postpone.set(\'' + on + '\', callback, ' + repeatAfter + ');';
		}
		// Close the method
		method += '}';

		// Grab on the queue
		postpone.queue[taskDateString] = method;
		// Grab on the storage
		storage.setItem('postponeQueue', JSON.stringify(postpone.queue));
	};

	/**
	 * Method that executes all the past tasks by comparing the dates
	 * into the queue with today's date and time. When it matchs with
	 * more than one task to launch, it executes again (recursivity).
	 * @name check
	 * @methodOf postpone
	 */
	postpone.check = function () {
		// Proceed only if there are at least ONE task into queue
		if (Object.keys(postpone.queue).length === 0) { return false; }

		// Create a new Date instance of today
		var now = new Date(),
			// The string saved as task key
			taskDateString = Object.keys(postpone.queue)[0],
			// Get the first task on queue
			taskDate = new Date(taskDateString),
			// Each tag created for each task execution
			scriptTag;

		// Compare task time with the new instance of Date
		// Continue only if it IS or WAS time to execute the task
		// TODO: delete tag
		if (taskDate <= now) {
			// Get a copy of an empty script element
			scriptTag = script.cloneNode();
			// Append the task callback as an auto-executable method into the script element
			scriptTag.innerHTML = '(' + postpone.queue[taskDateString] + '())';
			// Add the script tag to the head tag. It forces the execution
			head.appendChild(scriptTag);
			// Forget about this task for future executions
			delete postpone.queue[taskDateString];
			// Grab on the storage
			storage.setItem('postponeQueue', JSON.stringify(postpone.queue));
			// Look for more tasks that shoulda been launched when browser kept closed
			postpone.check();
		}
	};

	/**
	 * Reset the queue.
	 * @name clear
	 * @methodOf postpone
	 */
	postpone.clear = function () {
		// Set the queue as an empty object
		postpone.queue = {};
		// Save the new queue into local storage
		storage.setItem('postponeQueue', '{}');
	};

	/**
	 * Tool to manage a queue of tasks for browser-based apps.
	 * @name postpone
	 * @namespace
	 */
	window.postpone = postpone;

}(this));