// track when document is ready, must run before the page is finished loading
if (!document.readyState) {
	document.readyState = 'loading';
	
	/*--if (document.attachEvent) { // like IE
		document.attachEvent('onreadystatechange',
			function() {
				if (document.readyState == 'complete') {
					document.detachEvent('onreadystatechange', arguments.callee);
				}
			}
		);
	}
	else */if (document.addEventListener) { // like Mozilla
		document.addEventListener('DOMContentLoaded',
			function () {
				document.removeEventListener('DOMContentLoaded', arguments.callee, false);
				document.readyState = 'complete';
			},
			false
		);
	}
}

(function() {
	var glowMap;
	
	/**
		@public
		@name Glow
		@constructor
		@description Creates an instance of the Glow JavaScript Library.
		@param {string} [version]
		@param {object} [opts]
		@param {string} [opts.base] The path to the base folder, in which the Glow versions are kept.
		@param {boolean} [opts.debug] Have all filenames modified to point to debug versions.

	 */
	window.Glow = function(version, opts) { /*debug*///log.info('new Glow("'+Array.prototype.join.call(arguments, '", "')+'")');
		var glowInstance;
		
		opts = opts || {};
		
		var debug = (opts.debug)? '.debug' : '';

		glowMap = {
			versions: ['2.0.0', '@'+'SRC@'],
			'2.0.0': {
				'core':    ['core'+debug+'.js'],
				'widgets': ['core', 'widgets'+debug+'.js', 'widgets'+debug+'.css']
			}
		};
		
		if (opts._map) { glowMap = opts._map; } // for testing purposes map can be overridden
		
		version = getVersion(version); /*debug*///log.info('Version is "'+version+'"');
		
		if (Glow._build.instances[version]) { /*debug*///log.info('instance for "'+version+'" already exists.');
			return Glow._build.instances[version];
		}
		
		// opts.base should be formatted like a directory
		if (opts.base && opts.base.charAt(opts.base.length-1) !== '/') {
			opts.base += '/';
		}
		
		glowInstance = new glow(version, opts.base);
		Glow._build.instances[version] = glowInstance;
		
		glowInstance.debug = false; /*!debug*/ glowInstance.debug = true; /*gubed!*/
		glowInstance.UID = 'glow' + Math.floor(Math.random() * (1<<30));

 		glowInstance.load('core'); // core is always loaded;
 		 		
		return glowInstance;
	}
	
	/**
		@private
		@name getVersion
		@function
		@param {string} version A (possibly imprecise) version identifier, like "2".
		@description Find the most recent, available version of glow that matches.
	 */
	var getVersion = function(version) { /*debug*///log.info('getVersion("'+version+'")');
		var versions = glowMap.versions,
			matchThis = version + '.';
		
		// TODO: an empty version means: the very latest version
		
		var i = versions.length;
		while (i--) {
			if ( ( versions[i] + '.').indexOf(matchThis) === 0 ) {
				return versions[i];
			}
		}
		
		throw new Error('Version "'+version+'" does not exist');
	}
	
	/**
		@private
		@name getMap
		@function
		@description Find the file map for a given version.
		@param {string} version Resolved identifier, like '2.0.0'.
		@returns {object} A map of package names to files list.
	 */
	var getMap = function(version, debug) { /*debug*///log.info('getMap("'+version+'")');
		var versions = glowMap.versions,
			map = null,
			versionFound = false;
		
		var i = versions.length;
		while (--i > -1) {
			if (glowMap[versions[i]]) { map = glowMap[versions[i]]; }
			if (versions[i] === version) { versionFound = true; }
			if (versionFound && map) { return map; }
		}
		
		throw new Error('No map available for version "' + version + '".');
	}
	
	/**
		@private
		@name injectJs
		@function
		@description Start asynchronously loading an external JavaScript file.
	 */
	var injectJs = function(src) { /*debug*///log.info('injectJs("'+src+'")');
		var head,
			script;
		
		head = document.getElementsByTagName('head')[0];
		script = document.createElement('script');
		script.src = src;
		script.type = 'text/javascript';
		
		head.insertBefore(script, head.firstChild); // rather than appendChild() to avoid IE bug when injecting SCRIPTs after BASE tag opens. see: http://shauninman.com/archive/2007/04/13/operation_aborted
	}
	
	/**
		@private
		@name injectCss
		@function
		@description Start asynchronously loading an external CSS file.
	 */
	var injectCss = function(src) { /*debug*///log.info('injectCss("'+src+'")');
		var head,
			link;
			
		head = document.getElementsByTagName('head')[0];
		link = document.createElement('link');
		link.href = src;
		link.type = 'text/css';
		link.rel = 'stylesheet';
		
		head.insertBefore(link, head.firstChild);
	}
	
	/** @private */
	Glow._build = {
		provided: [], // provided but not yet complete
		instances: {} // built
	}
	
	/**
		@private
		@name Glow.provide
		@function
		@param {function} builder A function to run, given an instance of glow, and will add a feature to glow.
		@description Provide a builder function to Glow as part of a package.
	 */
	Glow.provide = function(builder) { /*debug*///log.info('Glow.provide('+typeof builder+')');
		Glow._build.provided.push(builder);
	}
	
	/**
		@private
		@name Glow.complete
		@function
		@param {string} name The name of the completed package.
		@param {string} version The version of the completed package.
		@description Signals that no more builder functions will be provided by this package.
	 */
	Glow.complete = function(name, version) { /*debug*///log.info('complete('+name+', '+version+')');
		var glow,
			loading,
			builders;

		// now that we have the name and version we can move the builders out of provided cache
		glow = Glow._build.instances[version];
		if (!glow) { /*debug*///log.info('Cannot complete, unknown version of glow: '+version);
			throw new Error('Cannot complete, unknown version of glow: '+version);
		}
		glow._build.builders[name] = Glow._build.provided;
		Glow._build.provided = [];

		// shortcuts
		loading   = glow._build.loading;
		builders = glow._build.builders;
		
		// try to build packages, in the same order they were loaded
		for (var i = 0; i < loading.length; i++) { // loading.length may change during loop
			if (!builders[loading[i]]) { /*debug*///log.info(loading[i]+' has no builders.');
				break;
			}
			
			// run the builders for this package in the same order they were loaded
			for (var j = 0, jlen = builders[loading[i]].length; j < jlen; j++) { /*debug*///log.info('running builder '+j+ ' for '+loading[i]+' version '+glow.version);
				builders[loading[i]][j](glow); // builder will modify glow
			}
			
			// remove this package from the loaded and builders list, now that it's built
			if (glow._removeReadyBlock) { glow._removeReadyBlock('glow_loading_'+loading[i]); }
			builders[loading[i]] = undefined;
			loading.splice(i, 1);
			i--;
			
			
		}
		
		// try to run onLoaded callbacks
		glow._release();
	}
	
	/**
		@name glow
		@static
		@class
		@description An instance of the Glow library. Returned by calling new Glow().
		@property {string} version
		@property {string} base
	 */
	var glow = function(version, base) { /*debug*///log.info('new glow("'+Array.prototype.join.call(arguments, '", "')+'")');
		this.version = version;
		this.base = base || '';
		this.map = getMap(version);
		this._build = {
			loading: [],   // names of packages requested but not yet built, in same order as requested.
			builders: {},  // completed but not yet built (waiting on dependencies). Like _build.builders[packageName]: [function, function, ...].
			history: {},   // names of every package ever loaded for this instance
			callbacks: []
		};
	}
	
	/**
		@public
		@name glow#load
		@function
		@description Add a package to this instance of the Glow library.
		@param {string[]} ... The names of 1 or more packages to add.
	 */
	glow.prototype.load = function() { /*debug*///log.info('glow.load("'+Array.prototype.join.call(arguments, '", "')+'") for version '+this.version);
		var name = '',
			src,
			depends;
		
		for (var i = 0, len = arguments.length; i < len; i++) {
			name = arguments[i];
			
			if (this._build.history[name]) { /*debug*///log.info('already loaded package "'+name+'" for version '+this.version+', skipping.');
				continue;
			}
			
			this._build.history[name] = true;
			
			// packages have dependencies, listed in the map: a single js file, css files, or even other packages
			depends = this.map[name]; /*debug*///log.info('depends for '+name+' '+this.version+': "'+depends.join('", "')+'"');
			for (var j = 0, lenj = depends.length; j < lenj; j++) {
				
				if (depends[j].slice(-3) === '.js') { /*debug*///log.info('dependent js: "'+depends[j]+'"');
					src = this.base + this.version + '/' + depends[j];
					
					// readyBlocks are removed in _release()
					if (this._addReadyBlock) { this._addReadyBlock('glow_loading_'+name); } // provided by core
					this._build.loading.push(name);
					
					injectJs(src);
				}
				else if (depends[j].slice(-4) === '.css') { /*debug*///log.info('dependent css "'+depends[j]+'"');
					src = this.base + this.version + '/' + depends[j];
					injectCss(src);
				}
				else { /*debug*///log.info('dependent package: "'+depends[j]+'"');
					this.load(depends[j]); // recursively load dependency packages
				}
			}
		}
		
		return this;
	};
	
	/**
		@public
		@name glow#loaded
		@function
		@param {function} onLoadCallback Called when all the packages load.
		@description Do something when all the packages load.
	 */
	glow.prototype.loaded = function(onLoadCallback) { /*debug*///log.info('glow.loaded('+typeof onLoadCallback+') for version '+this.version);
		this._build.callbacks.push(onLoadCallback);
		if (this._addReadyBlock) { this._addReadyBlock('glow_loading_loadedcallback'); }
		
		this._release();
		
		return this;
	}
	
	/**
		@private
		@name glow#_release
		@function
		@description If all loaded packages are now built, then run the onLoaded callbacks.
	 */
	glow.prototype._release = function() { /*debug*///log.info('glow._release("'+this.version+'")');
		var callback;
		
		if (this._build.loading.length !== 0) { /*debug*///log.info('waiting for '+this._build.loading.length+' to finish.');
			return;
		}
		/*debug*///log.info('running '+this._build.callbacks.length+' loaded callbacks for version "'+this.version+'"');
		
		// run and remove each available _onloaded callback
		while (callback = this._build.callbacks.shift()) {
			callback(this);
			if (this._removeReadyBlock) { this._removeReadyBlock('glow_loading_loadedcallback'); }
		}
	}
	
	/**
		@name glow#ready
		@function
		@param {function} onReadyCallback Called when all the packages load and the DOM is available.
		@description Do something when all the packages load and the DOM is ready.
	 */
	glow.prototype.ready = function(onReadyCallback) { /*debug*///log.info('(ember) glow#ready('+typeof onReadyCallback+') for version '+this.version+'. There are '+this._build.loading.length+' loaded packages waiting to be built.');
		this.loaded(function(glow) {
			glow.ready( function() { onReadyCallback(glow); } );
		});

		return this;
	}
})();