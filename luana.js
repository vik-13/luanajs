/*
*
* version: 2.2.8
*
* */

;( function( window, document, undefined ){
	var packages = {},
		modules = {},
		cases = {},
		ready = false,
		loaded = false,

		defaults = {
			type: 'ui', // could be ui, library
			compile: 'onReady', // could be onReady, onLoad, manually
			global: false // if true, attach module interface to window[module_name]
		},

		PackageManager, CaseManager,

		moduleSelectorPattern = '[luana-module="{name}"], .luana-module-{name}',

		_isUndefined = function( value ){
			return typeof value === 'undefined';
		},
		_isBoolean = function( value ){
			return ( typeof value === 'boolean' );
		},
		_isArray = function( value ){
			return ( Object.prototype.toString.call( value ) === '[object Array]' );
		},
		_log = function( log, type ){
			if( !_isUndefined( window.console ) && !_isUndefined( console.log ) && luana.developerMode ){
				if( !_isUndefined( type ) ){
					if( type == 'error' ){
						console.log( '%c ' + log, 'color: #FF302C;' );
					}else if( type == 'warning' ){
						console.log( '%c ' + log, 'color: #FB9D17;' );
					}else{
						console.log( '%c ' + log, 'color: #35BD37;' );
					}
				}else{
					console.log( log );
				}
			}
		},
		_getAttributes = function( name ){
			var attr = {
					name: '',
					caseName: false
				}, i, tempArray = [],
				attrArray = name.split( '.' );
			if( attrArray.length <= 1 ){
				attr.name = name;
			}else{
				attr.name = attrArray[0];
				for( i = 1; i < attrArray.length; i++ ){
					tempArray.push( attrArray[i] );
				}
				attr.caseName = tempArray.join( '.' );
			}
			return attr;
		},
		_moduleSelector = function( name ){
			return moduleSelectorPattern.replace( /{name}/gi, name );
		};

	if( _isUndefined( Function.prototype.bind ) ){
		Function.prototype.bind = function( context ){
			return ( function( func ){
				return function(){
					func.call( context );
				};
			} )( this );
		};
	}

	function Controller( pack, module ){
		var	_updateElements = function( scope ){

			$.each( CaseManager.getPackData( pack ).localSelectors,
				function( index, selector ){
					scope.elements[ index ] =
						$( scope.root ).find( selector );
				}
			);

			$.each( CaseManager.getPackData( pack ).globalSelectors,
				function( index, selector ){
                    scope.elements[ index ] = $( selector );
				}
			);

			$.each( CaseManager.getCasePackData( pack ),
				function( index, casePack ){
					$.each( casePack.localSelectors,
						function( _index, selector ){
							scope.elements[ _index ] =
								$( scope.root ).find( selector );
						}
					);
					$.each( casePack.globalSelectors,
						function( _index, selector ){
							scope.elements[ _index ] = $( selector );
						}
					);
				}
			);
		};

		this.__updateModule = function(){
			PackageManager.update( module.name );
		};
		this.__updateElements = function( scope ){
			if( !_isUndefined( scope ) ){
				_updateElements( scope );
			}else{
				$.each( module.scopes,
					function(){
						_updateElements( this );
					}
				);
			}
		};
		this.__throughScopes = function( iterrator ){
			$.each( module.scopes, iterrator );
		};
		this.__getScopes = function(){
			return module.scopes;
		};
		this.__getRoots = function(){
			return module.roots;
		};
		this.__getRootByScope = function( scope ){
			var root = false;
			$.each( this.__getRoots(),
				function( index, item ){
					if( $( item ).data( module.name ) == scope ){
						root = item;
					}
				}
			);
			return root;
		};
		this.__getRootByElement = function( element ){
			var root = false, scope, obj;
			scope = $( element ).data( module.name );
			if( !_isUndefined( scope ) ){
				root = element;
			}else{
				obj = $( element ).parents( _moduleSelector( module.name ) );
				if( obj ){
					if( !_isUndefined( $( obj ).data( module.name ) ) ){
						root = obj;
					}
				}
			}
			return root;
		};
		this.__getScopeByElement = function( element ){
			var scope = false,
				root = this.__getRootByElement( element );
			if( root ){
				scope = $( root ).data( module.name );
			}
			return scope;
		};
		this.__getScopesByElement = function( element ){
			var scopes = [],
				scope,
				elements = $( element );

			if( elements.length == 1 ){
				scopes = [this.__getScopeByElement( element )];
			}else if( elements.length > 1 ){
				$.each( elements,
					function( index, item ){
						scope = this.__getScopeByElement( item );
						if( scope ){
							scopes.push( scope );
						}
					}.bind( this )
				);
			}
			return scopes;
		};
		this.__setState = function( scope ){
			module.state = scope;
		};
		this.__getState = function(){
			return module.state;
		};
		this.__clearState = function(){
			module.state = false;
		};

		this.__setTimeout = function( callback, timeout ){
			this.__clearTimeout();
			module.timeout = window.setTimeout( callback, timeout );
		};
		this.__clearTimeout = function(){
			window.clearTimeout( module.timeout );
		};

		this.__setInterval = function( callback, interval ){
			this.__clearInterval();
			module.interval = window.setInterval( callback, interval );
		};
		this.__clearInterval = function(){
			window.clearInterval( module.interval );
		};
	}

	function View( module ){
		this.__getScopes = function(){
			return module.scopes;
		};
		this.__getRoots = function(){
			return module.roots;
		};
		this.__setState = function( scope ){
			module.state = scope;
		};
		this.__getState = function(){
			return module.state;
		};
		this.__clearState = function(){
			module.state = false;
		};
	}

	function Event( module, scope, eventType, handler, element, secondElement, preventDefault ){
		var _callback = function( event ){
			var additionalParameters = Array.prototype.slice.call( arguments, 1, arguments.length );
			if( preventDefault ){
					event.preventDefault();
				}
				if( scope ){
					module.controller[handler].call( module.controller, scope, this, event, additionalParameters );
				}else{
					module.controller[handler].call( module.controller, this, event, additionalParameters );
				}
			};
		if( !_isUndefined( module.controller[handler] ) ){
			if( luana.developerMode ){
				$( element ).addClass( 'l-' + module.name + '-e-' + eventType +
					'-handled' + ( ( secondElement ) ? '-live' : '' ) );
			}
			if( secondElement ){
				$( element ).on( eventType, secondElement, _callback );
			}else{
				$( element ).on( eventType, _callback );
			}
		}else{
			_log( module.name + ': Event ' + eventType + ' cannot be ' +
				'attached as there is no handler ' + handler, 'warning' );
		}
	}

	CaseManager = (function(){
		var _check = function( caseName ){
				var casesArray = caseName.split( '.' ),
					inverse = false, key,
					i, isTrue = true;
				for( i = 0; i < casesArray.length; i++ ){
					inverse = ( casesArray[i].indexOf( '!' ) === 0 );
					key = ( inverse ) ? casesArray[i].substr( 1 ) : casesArray[i];
					if( inverse ){
						if( !( typeof cases[key] !== 'undefined' && !cases[key] ) ){
							isTrue = false;
						}
					}else{
						if( !( typeof cases[key] !== 'undefined' && cases[key] ) ){
							isTrue = false;
						}
					}
				}
				return isTrue;
			};
		return {
			getPackData: function( pack ){
				return pack.data;
			},
			getCasePackData: function( pack ){
				var casePackData = [];
				$.each( pack.casesOrder,
					function( index, key ){
						if( _check( key ) ){
							casePackData.push( pack.casesData[key] );
						}
					}
				);
				return casePackData;
			},
			getOptions: function( pack ){
				var options;
				if( pack.data.factory ){
					options = pack.data.factory.options;
				}else{
					options = $.extend( true, {}, defaults );
				}
				return options;
			}
		};
	})();

	PackageManager = (function(){
		var _compilePackage = function( pack, type ){
				if( !pack.compiled && ( type == CaseManager.getOptions( pack ).compile || type == 'manually' ) ){
					modules[pack.name] = new Module( pack.name );
					if( CaseManager.getOptions( pack ).type === 'library' ){
						if( CaseManager.getPackData( pack ).factory ||
								CaseManager.getCasePackData( pack ).length ){
							_initializeLibrary( pack, modules[pack.name] );
							pack.compiled = true;
						}
					}else if( CaseManager.getOptions( pack ).type === 'ui' ){
						if( modules[pack.name].roots.length &&
								( CaseManager.getPackData( pack ).factory ||
									CaseManager.getCasePackData( pack ).length ) ){
							_initializeModule( pack, modules[pack.name] );
							pack.compiled = true;
						}else{
							_log( pack.name + ': compilation is skipped. There are no any roots.', 'error' );
							pack.errors.push( 'Cannot be compiled. Module doesn`t have any routs. You can set force = true to compile module without routs...' );
						}
					}
				}
			},
			_updatePackage = function( pack, module ){
				module.roots = $( _moduleSelector( pack.name ) );
				$.each( module.roots,
					function(){
						if( _isUndefined( $( this ).data( module.name ) ) ){
							_updateModule( pack, module, this );
						}
					}
				);
			},
			_initializeLibrary = function( pack, module ){
				var scope = {};

				$.each( CaseManager.getPackData( pack ).scope,
					function( index, packScope ){
						scope = $.extend( true, scope, packScope );
					}
				);

				$.each( CaseManager.getCasePackData( pack ),
					function( index, caseItem ){
						$.each( caseItem.scope,
							function( _index, packScope ){
								scope = $.extend( true, scope, packScope );
							}
						);
					}
				);

				_prepareView( pack, module );
				_prepareController( pack, module, scope );
				_prepareFace( pack, module );
			},
			_initializeModule = function( pack, module ){
				var scope = {}, localScope;

				$.each( CaseManager.getPackData( pack ).scope,
					function( index, packScope ){
						scope = $.extend( true, scope, packScope );
					}
				);

				$.each( CaseManager.getCasePackData( pack ),
					function( index, caseItem ){
						$.each( caseItem.scope,
							function( _index, packScope ){
								scope = $.extend( true, scope, packScope );
							}
						);
					}
				);

				_prepareView( pack, module );
				_prepareController( pack, module );
				_prepareFace( pack, module );

				scope.elements = {};

				pack.logs.push( 'Module has ' + module.roots.length + ( module.roots.length === 1 ? ' root' : ' roots' ) );

				$.each( module.roots,
					function( index, item ){

						localScope = $.extend( true, {}, scope );
						localScope.root = item;

						module.controller.__updateElements( localScope );

						module.scopes.push( localScope );

						$( item ).data( module.name, localScope );

						_attachEvents( pack, module, localScope );
						_eachScope( pack, module, localScope );
					}
				);

				_initialize( pack, module );
				_attachGlobalEvents( pack, module );
			},
			_updateModule = function( pack, module, root ){
				var scope = {}, localScope;

				$.each( CaseManager.getPackData( pack ).scope,
					function( index, packScope ){
						scope = $.extend( true, scope, packScope );
					}
				);

				$.each( CaseManager.getCasePackData( pack ),
					function( index, caseItem ){
						$.each( caseItem.scope,
							function( _index, packScope ){
								scope = $.extend( true, scope, packScope );
							}
						);
					}
				);

				scope.elements = {};

				localScope = $.extend( true, {}, scope );
				localScope.root = root;

				module.controller.__updateElements( localScope );
				module.scopes.push( localScope );

				$( root ).data( module.name, localScope );
				_attachEvents( pack, module, localScope );
				_eachScope( pack, module, localScope );
			},
			_prepareView = function( pack, module ){
				function ProxyView(){}
				ProxyView.prototype = new View( module );
				var vw = new ProxyView();

				$.each( CaseManager.getPackData( pack ).view,
					function( index, item ){
						$.extend( vw, item.call() );
					}
				);

				$.each( CaseManager.getCasePackData( pack ),
					function( index, caseItem ){
						$.each( caseItem.view,
							function( _index, packScope ){
								$.extend( vw, packScope.call() );
							}
						);
					}

				);

				module.view = vw;
			},
			_prepareController = function( pack, module, scope ){
				function ProxyController(){}
				ProxyController.prototype = new Controller( pack, module );
				var ctrl = new ProxyController();

				$.each( CaseManager.getPackData( pack ).controller,
					function( index, item ){
						if( !_isUndefined( scope ) ){
							$.extend( ctrl, item( module.view, scope ) );
						}else{
							$.extend( ctrl, item( module.view ) );
						}
					}
				);

				$.each( CaseManager.getCasePackData( pack ),
					function( index, caseItem ){
						$.each( caseItem.controller,
							function( _index, item ){
								if( !_isUndefined( scope ) ){
									$.extend( ctrl, item( module.view, scope ) );
								}else{
									$.extend( ctrl, item( module.view ) );
								}
							}
						);
					}
				);
				module.controller = ctrl;
			},
			_prepareFace = function( pack, module ){
				var faces = [];

				$.each( CaseManager.getPackData( pack ).faces,
					function( index, item ){
						faces = faces.concat( item );
					}
				);

				$.each( CaseManager.getCasePackData( pack ),
					function( index, caseItem ){
						$.each( caseItem.faces,
							function( _index, item ){
								faces = faces.concat( item );
							}
						);
					}
				);

				$.each( faces,
					function( index, face ){
						if( _isUndefined( module.face[face] ) ){
							module.face[face] = function(){
								return module.controller[face].apply( module.controller, arguments );
							}
						}
					}
				);
				pack.logs.push( 'Module has ' + faces.length + ( faces.length === 1 ? ' face' : ' faces' ) );
				if( CaseManager.getOptions( pack ).global ){
					if( _isUndefined( window[pack.name] ) ){
						window[pack.name] = module.face;
					}
					pack.logs.push( 'Module has a face on the global scope with name: ' + pack.name );
				}
			},
			_checkEventsExisting = function( pack ){
				var events = [], i,
					casePacks = CaseManager.getCasePackData( pack );
				if( casePacks.length ){
					for( i = casePacks.length - 1; i >= 0; i-- ){
						if( casePacks[i].events.length ){
							events = casePacks[i].events;
							break;
						}
					}
				}
				if( !events.length ){
					events = CaseManager.getPackData( pack ).events;
				}
				return events;
			},
			_attachEvents = function( pack, module, scope ){
				var preventDefault = false,
					element = false,
					secondElement = false,
					eventType = false,
					eventsCount = 0,
					elementsCount = 0,
					events;

				events = _checkEventsExisting( pack );
				$.each( events,
					function( index, item ){
						module.events = $.extend( true, module.events, item( scope ) );
					}
				);
				$.each( module.events,
					function( handler, item ){
						preventDefault = false;
						secondElement = false;
						element = item[1];
						eventType = item[0];
						if( !_isUndefined( item[2] ) ){
							if( _isBoolean( item[2] ) ){
								preventDefault = item[2];
							}else{
								secondElement = item[2];
								if( !_isUndefined( item[3] ) ){
									preventDefault = item[3];
								}
							}
						}
						Event( module, scope, eventType, handler, element, secondElement, preventDefault );
						elementsCount += $( item[1] ).length;
						eventsCount++;
					}
				);
				pack.logs.push( 'Module has ' + eventsCount + ( eventsCount === 1 ? ' event' : ' events' ) +
					' attached to ' + elementsCount + ( elementsCount === 1 ? ' element' : ' elements' ) );
			},
			_checkGlobalEventsExisting = function( pack ){
				var events = [], i,
					casePacks = CaseManager.getCasePackData( pack );
				if( casePacks.length ){
					for( i = casePacks.length - 1; i >= 0; i-- ){
						if( casePacks[i].globalEvents.length ){
							events = casePacks[i].globalEvents;
							break;
						}
					}
				}
				if( !events.length ){
					events = CaseManager.getPackData( pack ).globalEvents;
				}
				return events;
			},
			_attachGlobalEvents = function( pack, module ){
				var preventDefault = false,
					element = false,
					secondElement = false,
					eventType = false,
					elementsCount = 0,
					events;

				events = _checkGlobalEventsExisting( pack );
				$.each( events,
					function( index, item ){
						module.globalEvents = $.extend( true, module.globalEvents, item() );
					}
				);

				$.each( module.globalEvents,
					function( handler, item ){
						preventDefault = false;
						secondElement = false;
						element = item[1];
						eventType = item[0];
						if( !_isUndefined( item[2] ) ){
							if( _isBoolean( item[2] ) ){
								preventDefault = item[2];
							}else{
								secondElement = item[2];
								if( !_isUndefined( item[3] ) ){
									preventDefault = item[3];
								}
							}
						}
						Event( module, false, eventType, handler, element, secondElement, preventDefault );
						elementsCount += $( item[1] ).length;
					}
				);
			},
			_eachScope = function( pack, module, scope ){
				if( !_isUndefined( module.controller.__eachScope ) ){
					module.controller.__eachScope.call( module.controller, scope );
				}
			},
			_initialize = function( pack, module ){
				if( !_isUndefined( module.controller.__initialize ) ){
					module.controller.__initialize.call( module.controller );
				}
			};

		return {
			compile: function( type, packageName ){
				if( _isUndefined( packageName ) ){
					$.each( packages,
						function( index, pack ){
							_compilePackage( pack, type );
						}
					);
				}else{
					if( !_isUndefined( packages[packageName] ) ){
						_compilePackage( packages[packageName], type );
					}
				}
			},
			update: function( packageName ){
				if( !_isUndefined( packageName ) && !_isUndefined( packages[packageName] ) ){
					if( !_isUndefined( modules[packageName] ) ){
						_updatePackage( packages[packageName], modules[packageName] );
					}
				}
			}
		};
	})();

	function Module( name ){
		this.name = name;
		this.roots = $( _moduleSelector( name ) );
		this.scopes = [];
		this.view = {};
		this.controller = {};
		this.events = {};
		this.globalEvents = {};
		this.face = {};

		this.state = false;
		this.interval = false;
		this.timeout = false;
	}

	function Package( name, factory ){
		this.name = name;

		this.compiled = false;

		this.dataPattern = {
			factory: false,
			scope: [],
			localSelectors: {},
			globalSelectors: {},
			events: [],
			globalEvents: [],
			controller: [],
			view: [],
			faces: []
		};

		this.data = $.extend( true, {}, this.dataPattern );
		this.data.factory = factory;

		this.casesData = {};
		this.casesOrder = [];

		this.errors = [];
		this.logs = [];

		this.getData = function( caseName ){
			return ( !caseName ) ? this.data : this.casesData[caseName];
		};
	}

	Package.prototype = {
		addScope: function( caseName, scope ){
			this.getData( caseName ).scope.push( scope );
		},
		addLocalSelectors: function( caseName, selectors ){
			$.extend( this.getData( caseName ).localSelectors, selectors );
		},
		addGlobalSelectors: function( caseName, selectors ){
			$.extend( this.getData( caseName ).globalSelectors, selectors );
		},
		addEvents: function( caseName, events ){
			this.getData( caseName ).events.push( events );
		},
		addGlobalEvents: function( caseName, events ){
			this.getData( caseName ).globalEvents.push( events );
		},
		addController: function( caseName, controller ){
			this.getData( caseName ).controller.push( controller );
		},
		addView: function( caseName, view ){
			this.getData( caseName ).view.push( view );
		},
		addFaces: function( caseName, face ){
			this.getData( caseName ).faces.push( face );
		},
		prepareDataForCase: function( caseName, factory ){
			if( typeof this.getData( caseName ) === 'undefined' ){
				$.extend( true, this.casesData[caseName] = {}, this.dataPattern );
				this.casesData[caseName].factory = factory;
			}
		},
		setMainCase: function( factory ){
			this.data.factory = factory;
		},
		hasCase: function( caseName ){
			return typeof this.casesData[caseName] !== 'undefined';
		},
		getFactory: function( caseName ){
			return ( !caseName ) ? this.data.factory : this.casesData[caseName].factory;
		}
	};

	function Factory( name, caseName, options ){
		this.name = name;
		this.caseName = caseName;
		this.options = $.extend( true, $.extend( true, {}, defaults ), options );
	}

	Factory.prototype = {
		faces: function(){
			var face = [];
			$.each( arguments, function( index, item ){
				if( _isArray( item ) ){
					face = face.concat( item );
				}else{
					face.push( item );
				}
			} );
			packages[this.name].addFaces( this.caseName, face );
			return this;
		},
		describeScope: function( scope ){
			packages[this.name].addScope( this.caseName, scope );
			return this;
		},
		defineElements: function( localSelectors, globalSelectors ){
			packages[this.name].addLocalSelectors( this.caseName, localSelectors );
			if( !_isUndefined( globalSelectors ) ){
				packages[this.name].addGlobalSelectors( this.caseName, globalSelectors );
			}
			return this;
		},
		attachEvents: function( events ){
			packages[this.name].addEvents( this.caseName, events );
			return this;
		},
		attachGlobalEvents: function( events ){
			packages[this.name].addGlobalEvents( this.caseName, events );
			return this;
		},
		controller: function( controller ){
			packages[this.name].addController( this.caseName, controller );
			return this;
		},
		view: function( view ){
			packages[this.name].addView( this.caseName, view );
			return this;
		},
		compile: function(){
			if( !_isUndefined( packages[this.name] ) && packages[this.name].compiled ){
				PackageManager.update( this.name );
			}else{
				_compilePackages( 'manually', this.name );
			}
		},
		update: function(){
			if( !_isUndefined( packages[this.name] ) && packages[this.name].compiled ){
				PackageManager.update( this.name );
			}
		}
	};

	function Luana(){
		this.developerMode = false;
		this.factory = function( name, options ){
			var attributes = _getAttributes( name ),
				factory;
			if( _isUndefined( packages[attributes.name] ) ){
				packages[attributes.name] = new Package( attributes.name, false );
			}
			if( attributes.caseName === false ){
				packages[attributes.name].setMainCase( new Factory( attributes.name, false,
					_isUndefined( options ) ? {} : options ) );
				factory = packages[attributes.name].getFactory();
			}else if( !packages[attributes.name].hasCase( attributes.caseName ) ){
				packages[attributes.name].prepareDataForCase( attributes.caseName, new Factory( attributes.name, attributes.caseName,
					_isUndefined( options ) ? {} : options ) );
				packages[attributes.name].casesOrder.push( attributes.caseName );
				factory = packages[attributes.name].getFactory( attributes.caseName );
			}else{
				factory = packages[attributes.name].getFactory( attributes.caseName );
			}
			return factory;
		};
		this.module = function( name ){
			if( !_isUndefined( modules[name] ) ){
				return modules[name].face;
			}else{
				return false;
			}
		};
		this.hasModule = function( name ){
			return ( !_isUndefined( modules[name] ) && packages[name].compiled );
		};
		this.update = function(){
			$.each( packages, function( index, item ){
				this.factory( item['name'] ).compile();
			}.bind( this ) );
		};
		this.addCase = function( name, hanlder ){
			if( !_isUndefined( hanlder ) ){
				cases[name] = hanlder.call();
			}
		};
		this.getCases = function(){
			return cases;
		};
	}

	function _compilePackages( type, packName ){
		if( !_isUndefined( packName ) ){
			PackageManager.compile( type, packName );
		}else{
			PackageManager.compile( type );
		}
	}

	function _ready(){
		_compilePackages( 'onReady' );
		ready = true;
	}

	function _load(){
		_compilePackages( 'onLoad' );
		loaded = true;
	}

	window.luana = new Luana();

	$( document ).ready( _ready );
	$( window ).load( _load );
} )( window, document );