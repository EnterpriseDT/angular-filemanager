(function(angular) {
    'use strict';
    angular.module('FileManagerApp').service('apiHandler', ['$http', '$q', '$window', '$translate', '$httpParamSerializer', 'Upload',
        function ($http, $q, $window, $translate, $httpParamSerializer, Upload) {

        $http.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

        var ApiHandler = function() {
            this.inprocess = false;
            this.asyncSuccess = false;
            this.error = '';
        };

        ApiHandler.prototype.deferredHandler = function(data, deferred, code, defaultMsg) {
            if (!data || typeof data !== 'object') {
                this.error = 'Error %s - Bridge response error, please check the API docs or this ajax response.'.replace('%s', code);
            }
            if (code == 404) {
                this.error = 'Error 404 - Backend bridge is not working, please check the ajax response.';
            }
            if (data.result && data.result.error) {
                this.error = data.result.error;
            }
            if (!this.error && data.error) {
                this.error = data.error.message;
            }
            if (!this.error && defaultMsg) {
                this.error = defaultMsg;
            }
            if (this.error) {
                return deferred.reject(data);
            }
            return deferred.resolve(data);
        };

        ApiHandler.prototype.list = function(apiUrl, path, customDeferredHandler, exts) {
            var self = this;
            var dfHandler = customDeferredHandler || self.deferredHandler;
            var deferred = $q.defer();
            var data = {
                method: 'list',
                id: 0,
				params: {
                    path: path,
                    fileExtensions: exts && exts.length ? exts : undefined
                }
            };

            self.inprocess = true;
            self.error = '';

            $http.post(apiUrl, data).then(function(response) {
                dfHandler(response.data, deferred, response.status);
            }, function(response) {
                dfHandler(response.data, deferred, response.status, 'Unknown error listing, check the response');
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        ApiHandler.prototype.copy = function(apiUrl, items, path, singleFilename) {
            var self = this;
            var deferred = $q.defer();
            var data = {
                method: 'copy',
                id: 0,
				params: {
                    items: items,
                    newPath: path
                }
            };

            if (singleFilename && items.length === 1) {
				data.params.singleFilename = singleFilename;
            }

            self.inprocess = true;
            self.error = '';
            $http.post(apiUrl, data).then(function(response) {
                self.deferredHandler(response.data, deferred, response.status);
            }, function(response) {
                self.deferredHandler(response.data, deferred, response.status, $translate.instant('error_copying'));
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        ApiHandler.prototype.move = function(apiUrl, items, path) {
            var self = this;
            var deferred = $q.defer();
            var data = {
                method: 'move',
                id: 0,
				params: {
                    items: items,
                    newPath: path
                }
            };
            self.inprocess = true;
            self.error = '';
            $http.post(apiUrl, data).then(function(response) {
                self.deferredHandler(response.data, deferred, response.status);
            }, function(response) {
                self.deferredHandler(response.data, deferred, response.status, $translate.instant('error_moving'));
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        ApiHandler.prototype.remove = function(apiUrl, items) {
            var self = this;
            var deferred = $q.defer();
            var data = {
                method: 'remove',
                id: 0,
				params: {
                    items: items
                }
            };

            self.inprocess = true;
            self.error = '';
            $http.post(apiUrl, data).then(function(response) {
                self.deferredHandler(response.data, deferred, response.status);
            }, function(response) {
                self.deferredHandler(response.data, deferred, response.status, $translate.instant('error_deleting'));
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        ApiHandler.prototype.upload = function(apiUrl, destination, files) {
            var self = this;
            var deferred = $q.defer();
            self.inprocess = true;
            self.progress = 0;
            self.error = '';

            var data = {
                destination: destination
            };

            for (var i = 0; i < files.length; i++) {
                data['file-' + i] = files[i];
            }

            if (files && files.length) {
                Upload.upload({
                    url: apiUrl,
                    data: data
                }).then(function (data) {
                    self.deferredHandler(data.data, deferred, data.status);
                }, function (data) {
                    self.deferredHandler(data.data, deferred, data.status, 'Unknown error uploading files');
                }, function (evt) {
                    self.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total)) - 1;
                })['finally'](function() {
                    self.inprocess = false;
                    self.progress = 0;
                });
            }

            return deferred.promise;
        };

        ApiHandler.prototype.getContent = function(apiUrl, itemPath) {
            var self = this;
            var deferred = $q.defer();
            var data = {
                method: 'getContent',
                id: 0,
				params: {
                    item: itemPath
                }
            };

            self.inprocess = true;
            self.error = '';
            $http.post(apiUrl, data).then(function(response) {
                self.deferredHandler(response.data, deferred, response.status);
            }, function(response) {
                self.deferredHandler(response.data, deferred, response.status, $translate.instant('error_getting_content'));
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        ApiHandler.prototype.edit = function(apiUrl, itemPath, content) {
            var self = this;
            var deferred = $q.defer();
            var data = {
                method: 'edit',
                id: 0,
				params: {
                    item: itemPath,
                    content: content
                }
            };

            self.inprocess = true;
            self.error = '';

            $http.post(apiUrl, data).then(function(response) {
                self.deferredHandler(response.data, deferred, response.status);
            }, function(response) {
                self.deferredHandler(response.data, deferred, response.status, $translate.instant('error_modifying'));
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        ApiHandler.prototype.rename = function(apiUrl, itemPath, newPath) {
            var self = this;
            var deferred = $q.defer();
            var data = {
                method: 'rename',
                id: 0,
				params: {
                    item: itemPath,
                    newItemPath: newPath
                }
            };
            self.inprocess = true;
            self.error = '';
            $http.post(apiUrl, data).then(function(response) {
                self.deferredHandler(response.data, deferred, response.status);
            }, function(response) {
                self.deferredHandler(response.data, deferred, response.status, $translate.instant('error_renaming'));
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        ApiHandler.prototype.getUrl = function(apiUrl, path) {
            var data = {
                download: path
            };
            return path && [apiUrl, $httpParamSerializer(data)].join('?');
        };

        ApiHandler.prototype.download = function(apiUrl, itemPath, toFilename, downloadByAjax, forceNewWindow) {
            var self = this;
            var url = this.getUrl(apiUrl, itemPath);

            if (!downloadByAjax || forceNewWindow || !$window.saveAs) {
                !$window.saveAs && $window.console.log('Your browser dont support ajax download, downloading by default');
                return !!$window.open(url, '_blank', '');
            }

            var deferred = $q.defer();
            self.inprocess = true;
            $http.get(url).then(function(response) {
                var bin = new $window.Blob([response.data]);
                deferred.resolve(response.data);
                $window.saveAs(bin, toFilename);
            }, function(response) {
                self.deferredHandler(response.data, deferred, response.status, $translate.instant('error_downloading'));
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        ApiHandler.prototype.downloadMultiple = function(apiUrl, items, toFilename, downloadByAjax, forceNewWindow) {
            var self = this;
            var deferred = $q.defer();
            var data = {
                method: 'downloadMultiple',
                id: 0,
				params: {
                    items: items,
                    toFilename: toFilename
                }
            };
            var url = [apiUrl, $httpParamSerializer(data)].join('?');

            if (!downloadByAjax || forceNewWindow || !$window.saveAs) {
                !$window.saveAs && $window.console.log('Your browser dont support ajax download, downloading by default');
                return !!$window.open(url, '_blank', '');
            }

            self.inprocess = true;
            $http.get(apiUrl).then(function(response) {
                var bin = new $window.Blob([response.data]);
                deferred.resolve(response.data);
                $window.saveAs(bin, toFilename);
            }, function(response) {
                self.deferredHandler(response.data, deferred, response.status, $translate.instant('error_downloading'));
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        ApiHandler.prototype.compress = function(apiUrl, items, compressedFilename, path) {
            var self = this;
            var deferred = $q.defer();
            var data = {
                method: 'compress',
                id: 0,
				params: {
                    items: items,
                    destination: path,
                    compressedFilename: compressedFilename
                }
            };

            self.inprocess = true;
            self.error = '';
            $http.post(apiUrl, data).then(function(response) {
                self.deferredHandler(response.data, deferred, response.status);
            }, function(response) {
                self.deferredHandler(response.data, deferred, response.status, $translate.instant('error_compressing'));
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        ApiHandler.prototype.extract = function(apiUrl, item, folderName, path) {
            var self = this;
            var deferred = $q.defer();
            var data = {
                method: 'extract',
                id: 0,
				params: {
                    item: item,
                    destination: path,
                    folderName: folderName
                }
            };

            self.inprocess = true;
            self.error = '';
            $http.post(apiUrl, data).then(function(response) {
                self.deferredHandler(response.data, deferred, response.status);
            }, function(response) {
                self.deferredHandler(response.data, deferred, response.status, $translate.instant('error_extracting'));
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        ApiHandler.prototype.changePermissions = function(apiUrl, items, permsOctal, permsCode, recursive) {
            var self = this;
            var deferred = $q.defer();
            var data = {
                method: 'changePermissions',
                id: 0,
				params: {
                    items: items,
                    perms: permsOctal,
                    permsCode: permsCode,
                    recursive: !!recursive
                }
            };

            self.inprocess = true;
            self.error = '';
            $http.post(apiUrl, data).then(function(response) {
                self.deferredHandler(response.data, deferred, response.status);
            }, function(response) {
                self.deferredHandler(response.data, deferred, response.status, $translate.instant('error_changing_perms'));
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        ApiHandler.prototype.createFolder = function(apiUrl, path) {
            var self = this;
            var deferred = $q.defer();
            var data = {
                method: 'createFolder',
                id: 0,
				params: {
                    newPath: path
                }
            };

            self.inprocess = true;
            self.error = '';
            $http.post(apiUrl, data).then(function(response) {
                self.deferredHandler(response.data, deferred, response.status);
            }, function(response) {
                self.deferredHandler(response.data, deferred, response.status, $translate.instant('error_creating_folder'));
            })['finally'](function() {
                self.inprocess = false;
            });

            return deferred.promise;
        };
        
        ApiHandler.prototype.getLogoutPath = function(apiUrl) {
            var self = this;
            var deferred = $q.defer();
            var data = {
                method: 'getLogoutPath',
                id: 0,
                params: {}
            };

            self.inprocess = true;
            self.error = '';
            $http.post(apiUrl, data).then(function(response) {
                self.deferredHandler(response.data, deferred, response.status);
            }, function(response) {
                self.deferredHandler(response.data, deferred, response.status, $translate.instant('error_creating_folder'));
            })['finally'](function() {
                self.inprocess = false;
            });

            return deferred.promise;
        };

        return ApiHandler;

    }]);
})(angular);
