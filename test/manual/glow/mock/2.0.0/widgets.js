setTimeout(
	function() {
	
		Glow.provide(
			function(glow) {
				if (!glow.dom) { throw new Error('Cannot build widgets before dom.'); }
				
				glow.widgets = {};
				log.info(' (3) built widgets 2.0.0');
			}
		);
		
		Glow.complete('widgets', '2.0.0');
	},
	100 + Math.floor(Math.random()*1000)
);