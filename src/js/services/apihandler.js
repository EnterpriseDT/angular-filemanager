(function(angular) {
    'use strict';
    angular.module('FileManagerApp').service('apiHandler', ['$http', '$q', '$window', '$translate', '$httpParamSerializer', 'Upload',
        function ($http, $q, $window, $translate, $httpParamSerializer, Upload) {

        $http.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

        var ApiHandler = function(authenticationErrorHandler) {
            this.authenticationErrorHandler = authenticationErrorHandler;
            this.inprocess = false;
            this.asyncSuccess = false;
            this.error = '';
        };

        ApiHandler.prototype.deferredHandler = function(data, deferred, code, defaultMsg) {
            if (!data || typeof data !== 'object')
                this.error = 'Error %s - Server connection lost.'.replace('%s', code);
            if (code === 404)
                this.error = 'Error 404 - Server file-manager not found.';
            if (data.result && data.result.error)
                this.error = data.result.error;
            if (this && !this.error && data.error) {
                this.error = data.error.message;
                if (data.error.code === 1)
                    this.authenticationErrorHandler();
            }
            if (code == 500)
                this.authenticationErrorHandler();
            if (this && !this.error && defaultMsg)
                this.error = defaultMsg;
            if (this && this.error)
                return deferred.reject(data);
            return deferred.resolve(data);
        };

        ApiHandler.prototype.getInfo = function(apiUrl, customDeferredHandler) {
            // console.log("API call: getInfo");
            var self = this;
            var dfHandler = customDeferredHandler || self.deferredHandler;
            var deferred = $q.defer();
            var data = {
                method: 'getInfo',
                id: 0,
                params: {
                }
            };

            self.inprocess = true;
            self.error = '';

            $http.post(apiUrl, data).then(function(response) {
                dfHandler(response.data, deferred, response.status);
            }, function(response) {
                dfHandler(response.data, deferred, response.status, 'Unknown error getting info, check the response');
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        File.combine = function(path1, path2) {
            if (!path1 && path2)
                return path2;
            if (path1 && !path2)
                return path1;
            if (!path1 && !path2)
                throw "Cannot join null paths";
            if (!path1[path1.length-1]=='/')
                path1 += '/';
            if (path2[0]=='/')
                path2 = path.substr(1);
            return path1 + path2;
        }

        ApiHandler.prototype.exists = function(apiUrl, files, path, customDeferredHandler) {
            var self = this;
            var dfHandler = customDeferredHandler || self.deferredHandler;
            var deferred = $q.defer();
            var filePaths = files.map((f) => File.combine(path, !!f.path ? f.path : f.name));
            var data = {
                method: 'exists',
                id: 0,
                params: {
                    filePaths: filePaths
                }
            };

            self.inprocess = true;
            self.error = '';

            $http.post(apiUrl, data).then(function(response) {
                self.inprocess = false;
                dfHandler(response.data, deferred, response.status);
            }, function(response) {
                self.inprocess = false;
                dfHandler(response.data, deferred, response.status, 'Unknown error checking existence, check the response');
            })['finally'](function() {
            });
            return deferred.promise;
        };

        ApiHandler.prototype.list = function(apiUrl, path, customDeferredHandler, exts) {
            // console.log("API call: list");
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
                self.inprocess = false;
                dfHandler(response.data, deferred, response.status);
            }, function(response) {
                self.inprocess = false;
                dfHandler(response.data, deferred, response.status, 'Unknown error listing, check the response');
            })['finally'](function() {
            });
            return deferred.promise;
        };

        ApiHandler.prototype.share = function(apiUrl, items) {
            // console.log("API call: share");
            var self = this;
            var deferred = $q.defer();
            var data = {
                method: 'share',
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
                self.deferredHandler(response.data, deferred, response.status, $translate.instant('error_sharing'));
            })['finally'](function() {
                self.inprocess = false;
            });
            return deferred.promise;
        };

        ApiHandler.prototype.copy = function(apiUrl, items, path, singleFilename, overwrite) {
            // console.log("API call: copy");
            var self = this;
            var deferred = $q.defer();
            var data = {
                method: 'copy',
                id: 0,
                params: {
                    items: items,
                    newPath: path,
                    singleFilename: null,
                    overwrite: overwrite
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

        ApiHandler.prototype.move = function(apiUrl, items, path, overwrite) {
            // console.log("API call: move");
            var self = this;
            var deferred = $q.defer();
            var data = {
                method: 'move',
                id: 0,
                params: {
                    items: items,
                    newPath: path,
                    overwrite: overwrite
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
            // console.log("API call: remove");
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
            // console.log("API call: upload");
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
                    var message = self.getUploadErrorMessage(data.status, data.statusText);
                    self.deferredHandler({result:{error:message}}, deferred, data.status, message);
                }, function (evt) {
                    self.progress = Math.max(0, Math.min(100, parseInt(100.0 * evt.loaded / evt.total)) - 1);
                })['finally'](function() {
                    self.inprocess = false;
                    self.progress = 0;
                });
            }

            return deferred.promise;
        };

        ApiHandler.prototype.getUploadErrorMessage = function(statusCode, statusText) {
            var messageCode;
            switch (statusCode) {
                case 401:
                case 403:
                    if (statusText.indexOf("filter"))
                        messageCode = "error_filetype_not_allowed";
                    else
                        messageCode = "error_permission_denied";
                    break;
                case 404:
                    messageCode = "error_file_not_found";
                    break;
                case 408:
                    messageCode = "error_timeout";
                    break;
                case 500:
                     messageCode = "error_not_logged_in";
                     break;
                default:
                    messageCode = "error_uploading_files";
            }
            return $translate.instant(messageCode);
        };

        ApiHandler.prototype.getContent = function(apiUrl, itemPath) {
            // console.log("API call: getContent");
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
            // console.log("API call: edit");
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
            // console.log("API call: rename");
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
            // console.log("API call: download");
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
            // console.log("API call: downloadMultiple");
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
            // console.log("API call: compress");
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
            // console.log("API call: extract");
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
            // console.log("API call: changePermissions");
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
            // console.log("API call: createFolder");
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

        ApiHandler.prototype.createFile = function(apiUrl, path, content) {
            // console.log("API call: createFile");
            var self = this;
            var deferred = $q.defer();
            var data = {
                method: 'createFile',
                id: 0,
                params: {
                    newPath: path,
                    content: content
                }
            };

            self.inprocess = true;
            self.error = '';
            $http.post(apiUrl, data).then(function(response) {
                self.deferredHandler(response.data, deferred, response.status);
            }, function(response) {
                self.deferredHandler(response.data, deferred, response.status, $translate.instant('error_creating_file'));
            })['finally'](function() {
                self.inprocess = false;
            });

            return deferred.promise;
        };
        
        ApiHandler.prototype.login = function(apiUrl, username, password) {
            // console.log("API call: login");
            var self = this;
            var deferred = $q.defer();
            var data = {
                method: 'login',
                id: 0,
                params: [username, password]
            };

            self.inprocess = true;
            self.error = '';
            $http.post(apiUrl, data).then(function(response) {
                self.deferredHandler(response.data, deferred, response.status);
            }, function(response) {
                self.deferredHandler(response.data, deferred, response.status, $translate.instant('error_logging_in'));
            })['finally'](function() {
                self.inprocess = false;
            });

            return deferred.promise;
        };
        
        ApiHandler.prototype.logout = function(apiUrl, username, password) {
            // console.log("API call: logout");
            var self = this;
            var deferred = $q.defer();
            var data = {
                method: 'logout',
                id: 0,
                params: []
            };

            self.inprocess = true;
            self.error = '';
            $http.post(apiUrl, data).then(function(response) {
                self.deferredHandler(response.data, deferred, response.status);
            }, function(response) {
                self.deferredHandler(response.data, deferred, response.status, $translate.instant('error_logging_out'));
            })['finally'](function() {
                self.inprocess = false;
            });

            return deferred.promise;
        };

        return ApiHandler;

    }]);
})(angular);
