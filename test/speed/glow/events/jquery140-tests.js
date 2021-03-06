// First param is the library name, as defined in woosh.libs
woosh.addTests('jq-140', {
	'$preTest': function(prevTest, nextTest) {
		switch (nextTest) {
			case 'Firing Custom Listeners':
				window.testObj = {};
				window.eventsFired = 0
				$(testObj).bind('testEvent', function() {
					eventsFired++;
				}).bind('testEvent', function() {
					eventsFired++;
				}).bind('testEvent', function() {
					eventsFired++;
				});
				break;
		}
	},
	'Adding Custom Listeners': new woosh.Test(10000, function() {
		var obj = {};
		$(obj).bind('testEvent', function() {})
			  .bind('testEvent', function() {})
			  .bind('testEvent', function() {});
	}),
	'Firing Custom Listeners': new woosh.Test(20000, function() {
		$(testObj).trigger('testEvent');
		return eventsFired;
	}),
	'Removing Custom Listeners': new woosh.Test(10000, function() {
		var obj = {};
		$(obj).unbind('testEvent', function() {})
			  .unbind('testEvent', function() {})
			  .unbind('testEvent', function() {});
	})
});