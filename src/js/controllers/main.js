(function(angular) {
    'use strict';
    angular.module('FileManagerApp').controller('FileManagerCtrl', [
        '$scope', '$rootScope', '$window', '$translate', '$timeout', '$document', '$q', 'fileManagerConfig', 'item', 'fileNavigator', 'apiMiddleware',
        function($scope, $rootScope, $window, $translate, $timeout, $document, $q, fileManagerConfig, Item, FileNavigator, ApiMiddleware) {

        var $storage = $window.localStorage;
        $scope.config = fileManagerConfig;
        $scope.reverse = false;
        $scope.predicate = ['model.type', 'model.name'];
        $scope.order = function(predicate) {
            $scope.reverse = ($scope.predicate[1] === predicate) ? !$scope.reverse : false;
            $scope.predicate[1] = predicate;
        };
        $scope.query = '';
        var authenticationErrorHandler = function() {
            $scope.onAuthenticationError();
        };
        $scope.fileNavigator = new FileNavigator(authenticationErrorHandler);
        $scope.apiMiddleware = new ApiMiddleware(authenticationErrorHandler);
        $scope.uploadFileList = [];
        $scope.uploading = false;
        $scope.viewTemplate = $storage.getItem('viewTemplate') || 'main-icons.html';
        $scope.fileList = [];
        $scope.temps = [];
        $scope.isNativeShareSupported = !!navigator.share;

        $scope.$watch('temps', function() {
            if ($scope.singleSelection()) {
                $scope.temp = $scope.singleSelection();
            } else {
                $scope.temp = new Item({rights: 644});
                $scope.temp.multiple = true;
            }
            $scope.temp.revert();
        });

        $scope.fileNavigator.onRefresh = function() {
            $scope.temps = [];
            $scope.query = '';
            $rootScope.selectedModalPath = $scope.fileNavigator.currentPath;
        };

        $scope.setTemplate = function(name) {
            $storage.setItem('viewTemplate', name);
            $scope.viewTemplate = name;
        };

        $scope.changeLanguage = function (locale) {
            if (locale) {
                $storage.setItem('language', locale);
                return $translate.use(locale);
            }
            $translate.use($storage.getItem('language') || fileManagerConfig.defaultLang);
        };

        $scope.isSelected = function(item) {
            return $scope.temps.indexOf(item) !== -1;
        };

        $scope.selectOrUnselect = function(item, $event) {
            var indexInTemp = $scope.temps.indexOf(item);
            var isRightClick = $event && $event.which === 3;

            if ($event && $event.target.hasAttribute('prevent')) {
                $scope.temps = [];
                return;
            }
            if (! item || (isRightClick && $scope.isSelected(item))) {
                return;
            }
            if ($event && $event.shiftKey && !isRightClick) {
                var list = $scope.fileList;
                var indexInList = list.indexOf(item);
                var lastSelected = $scope.temps[0];
                var i = list.indexOf(lastSelected);
                var current = undefined;
                if (lastSelected && list.indexOf(lastSelected) < indexInList) {
                    $scope.temps = [];
                    while (i <= indexInList) {
                        current = list[i];
                        !$scope.isSelected(current) && $scope.temps.push(current);
                        i++;
                    }
                    return;
                }
                if (lastSelected && list.indexOf(lastSelected) > indexInList) {
                    $scope.temps = [];
                    while (i >= indexInList) {
                        current = list[i];
                        !$scope.isSelected(current) && $scope.temps.push(current);
                        i--;
                    }
                    return;
                }
            }
            if ($event && !isRightClick && ($event.ctrlKey || $event.metaKey)) {
                $scope.isSelected(item) ? $scope.temps.splice(indexInTemp, 1) : $scope.temps.push(item);
                return;
            }
            $scope.temps = [item];
        };

        $scope.singleSelection = function() {
            // if (!$scope.temps || $scope.temps.length === 0)
            //     $scope.prepareNewFolder();
            return $scope.temps.length === 1 && $scope.temps[0];
        };

        $scope.totalSelecteds = function() {
            return {
                total: $scope.temps.length
            };
        };

        $scope.selectionHas = function(type) {
            return $scope.temps.find(function(item) {
                return item && item.model.type === type;
            });
        };

        $scope.prepareNewFolder = function() {
            var item = new Item(null, $scope.fileNavigator.currentPath);
            item.model.name = $scope.getNewName('New folder*');
            $scope.temps = [item];
        };

        $scope.prepareNewFile = function() {
            var item = new Item(null, $scope.fileNavigator.currentPath);
            item.model.name = $scope.getNewName('New file*.txt');
            $scope.temps = [item];
        };
        
        $scope.getNewName = function(template) {
            for (var i=1;; i++) {
                var name = template.replace('*', i > 1 ? ' ' + i : '');
                if (!$scope.fileNavigator.fileList.find(function(item) { return item.model.name == name; }))
                    return name;
            }
        };

        $scope.smartClick = function(item) {
            var pick = $scope.config.allowedActions.pickFiles;
            if (item.isFolder()) {
                return $scope.fileNavigator.folderClick(item);
            }

            if (typeof $scope.config.pickCallback === 'function' && pick) {
                var callbackSuccess = $scope.config.pickCallback(item.model);
                if (callbackSuccess === true) {
                    return;
                }
            }

            if (item.isImage()) {
                if ($scope.config.previewImagesInModal) {
                    return $scope.openImagePreview(item);
                }
                return $scope.apiMiddleware.download(item, true);
            }

            if (item.isEditable()) {
                return $scope.openEditItem(item);
            }
        };

        $scope.openImagePreview = function() {
            var item = $scope.singleSelection();
            $scope.apiMiddleware.apiHandler.inprocess = true;
            $scope.modal('imagepreview', null, true)
                .find('#imagepreview-target')
                .attr('src', $scope.getUrl(item))
                .unbind('load error')
                .on('load error', function() {
                    $scope.apiMiddleware.apiHandler.inprocess = false;
                    $scope.$apply();
                });
        };

        $scope.openEditItem = function() {
            if (!$scope.fileNavigator.canUpload) {
                $scope.alert({message:'no_permission_title', args:{operation:$translate.instant('edit')}},
                    {message:'no_permission_text', args:{operation:$translate.instant('edit').toLowerCase()}});
                return;
            }
            var item = $scope.singleSelection();
            $scope.apiMiddleware.getContent(item).then(function(data) {
                item.tempModel.content = item.model.content = data.result;
            });
            $scope.modal('edit');
        };

        $scope.modal = function(id, hide, returnElement) {
            var element = angular.element('#' + id);
            var form = element.find('form');
            if (!hide && form) {
                var scope = $scope;
                if (form.attr('onopen')) {
                    var value = form.attr('onopen');
                    if (scope[value] instanceof Function)
                        scope[value].apply(this);
                    else
                        eval(value);
                }
                if (form.attr('onclose')) {
                    element.on('hidden.bs.modal', function() {
                        element.off('hidden.bs.modal');
                        var value = form.attr('onclose');
                        if (scope[value] instanceof Function)
                            scope[value].apply(this);
                        else
                            eval(value);
                    });
                }
            }
            element.modal(hide ? 'hide' : 'show');
            $scope.apiMiddleware.apiHandler.error = '';
            $scope.apiMiddleware.apiHandler.asyncSuccess = false;
            return returnElement ? element : true;
        };

        $scope.modalWithPathSelector = function(id) {
            $rootScope.selectedModalPath = $scope.fileNavigator.currentPath;
            return $scope.modal(id);
        };

        $scope.isInThisPath = function(path) {
            var p = $scope.fileNavigator.currentPath.join('/') + '/';
            return p.indexOf(path + '/') !== -1;
        };

        $scope.edit = function() {
            $scope.apiMiddleware.edit($scope.singleSelection()).then(function() {
                $scope.modal('edit', true);
            });
        };

        $scope.changePermissions = function() {
            $scope.apiMiddleware.changePermissions($scope.temps, $scope.temp).then(function() {
                $scope.fileNavigator.refresh();
                $scope.modal('changepermissions', true);
            });
        };

        $scope.download = function() {
            var item = $scope.singleSelection();
            if ($scope.selectionHas('dir')) {
                return;
            }
            if (item) {
                return $scope.apiMiddleware.download(item);
            }
            return $scope.apiMiddleware.downloadMultiple($scope.temps);
        };

        $scope.openUrl = function() {
            var item = $scope.singleSelection();
            var baseUrl = window.location.protocol + '//' + window.location.host;
            $window.open(baseUrl + $scope.fileNavigator.homeFolder + item.model.fullPath(), '_blank');
        };

        $scope.share = function() {
            if (!$scope.fileNavigator.sharingEnabled) {
                $scope.alert('no_sharing_title', 'no_sharing_text');
                return;
            }
            var scope = $scope;
            var files = $scope.apiMiddleware.getFileList($scope.temps);
            var fileNames = files.map(function(p) { return p.match(/[^\/]*$/)[0]; });
            
            $scope.apiMiddleware.exists(fileNames, '/Shares')
            .then(function(existResponse) {
                var existingFiles = existResponse.result;
                if (existingFiles && existingFiles.length > 0) {
                    var deferred = $q.defer();
                    var fileString = existingFiles.slice(0, 10).map(function(s) { return s.match(/([^\/]+)$/)[1]; }).join(', ');
                    scope.confirm(
                        {message:'shares_exist_title'}, {message:'shares_exist_prompt', args: { files: fileString }}, 
                        function(overwrite) { return overwrite ? deferred.resolve() : deferred.reject(); });
                    return deferred.promise;
                }
            })
            .then(function() {
                return scope.apiMiddleware.share(files);
            })
            .then(function(shareResponse) {
                scope.fileNavigator.shares = shareResponse.result;
                var baseUrl = window.location.protocol + '//' + window.location.host;
                scope.fileNavigator.shares.forEach(function(share) { return share.url = baseUrl + share.url + '/' + share.name; });
                scope.modal('share');
            })
            .catch(function(error) { 
                console.log(error);
            });
        };

        $scope.sendToNativeShare = function() {
            if (!$scope.fileNavigator.shares || $scope.fileNavigator.shares.length === 0)
                return;
            var share = $scope.fileNavigator.shares[0];
            var shareInfo = {
                title: share.name,
                text: share.name,
                url: share.url
            };
            navigator.share(shareInfo)
            .then(function() { console.log('Successful share'); })
            .catch(function(error) { console.log('Error sharing', error); });
        };

        $scope.copyShareLink = function(textAreaID) {
            var copyText = $document[0].getElementById(textAreaID);
            copyText.select();
            $document[0].execCommand('copy');
        };

        $scope.copy = function() {
            var item = $scope.singleSelection();
            if (item) {
                var name = item.tempModel.name.trim();
                var nameExists = $scope.fileNavigator.fileNameExists(name);
                if (nameExists && validateSamePath(item)) {
                    $scope.apiMiddleware.apiHandler.error = $translate.instant('error_invalid_filename');
                    return false;
                }
                if (!name) {
                    $scope.apiMiddleware.apiHandler.error = $translate.instant('error_invalid_filename');
                    return false;
                }
            }
            $scope.apiMiddleware.copy($scope.temps, $rootScope.selectedModalPath, $scope.fileNavigator.overwrite).then(function() {
                $scope.fileNavigator.refresh();
                $scope.modal('copy', true);
                $scope.fileNavigator.overwrite = false;
            });
        };

        $scope.cancelCopy = function() {
            var item = $scope.singleSelection();
            if (item && item.model)
                    item.tempModel.name = item.model.name;
            $scope.fileNavigator.overwrite = false;
        };

        $scope.compress = function() {
            var name = $scope.temp.tempModel.name.trim();
            var nameExists = $scope.fileNavigator.fileNameExists(name);

            if (nameExists && validateSamePath($scope.temp)) {
                $scope.apiMiddleware.apiHandler.error = $translate.instant('error_invalid_filename');
                return false;
            }
            if (!name) {
                $scope.apiMiddleware.apiHandler.error = $translate.instant('error_invalid_filename');
                return false;
            }

            $scope.apiMiddleware.compress($scope.temps, name, $rootScope.selectedModalPath).then(function() {
                $scope.fileNavigator.refresh();
                if (! $scope.config.compressAsync) {
                    return $scope.modal('compress', true);
                }
                $scope.apiMiddleware.apiHandler.asyncSuccess = true;
            }, function() {
                $scope.apiMiddleware.apiHandler.asyncSuccess = false;
            });
        };

        $scope.extract = function() {
            var item = $scope.temp;
            var name = $scope.temp.tempModel.name.trim();
            var nameExists = $scope.fileNavigator.fileNameExists(name);

            if (nameExists && validateSamePath($scope.temp)) {
                $scope.apiMiddleware.apiHandler.error = $translate.instant('error_invalid_filename');
                return false;
            }
            if (!name) {
                $scope.apiMiddleware.apiHandler.error = $translate.instant('error_invalid_filename');
                return false;
            }

            $scope.apiMiddleware.extract(item, name, $rootScope.selectedModalPath).then(function() {
                $scope.fileNavigator.refresh();
                if (! $scope.config.extractAsync) {
                    return $scope.modal('extract', true);
                }
                $scope.apiMiddleware.apiHandler.asyncSuccess = true;
            }, function() {
                $scope.apiMiddleware.apiHandler.asyncSuccess = false;
            });
        };

        $scope.showRemove = function() {
            if (!$scope.fileNavigator.canRemove) {
                $scope.alert({message:'no_permission_title', args:{operation:$translate.instant('remove')}},
                    {message:'no_permission_text', args:{operation:$translate.instant('remove').toLowerCase()}});
                return;
            }
            $scope.modal('remove');
        };

        $scope.remove = function() {
            $scope.apiMiddleware.remove($scope.temps).then(function() {
                $scope.fileNavigator.refresh();
                $scope.modal('remove', true);
            });
        };

        $scope.onAuthenticationError = function() {
            // doesn't work without the timeout here - race condition?
            $timeout(function() {
                $scope.modal('login');
            }, 300);
        };
        
        $scope.login = function() {
            if (!$scope.username || !$scope.password)
                return;
            $scope.fileNavigator.currentPath = [];
            $scope.apiMiddleware.login($scope.username, $scope.password).then(function() {
                $scope.password = '';
                $scope.fileNavigator.refresh().then(function() {
                    $scope.modal('login', true);
                });
            }, function(err) {
                if (typeof(err)=='string') // happens when RPC was redirected to /Login
                    $window.location.href = '/Login';
            });
        };
        
        $scope.logout = function() {
            $scope.apiMiddleware.logout($scope.temps).then(function(data) {
                if (data.result.publicAccessEnabled) {
                    $scope.username = '';
                    $scope.modal('logout', true);
                    $scope.fileNavigator.refresh();
                } else
                    $window.location.href = '/Login';
            });
        };

        $scope.showMove = function() {
            if (!$scope.fileNavigator.canRename) {
                $scope.alert({message:'no_permission_title', args:{operation:$translate.instant('move')}},
                    {message:'no_permission_text', args:{operation:$translate.instant('move').toLowerCase()}});
                return;
            }
            $scope.modalWithPathSelector('move');
        };

        $scope.move = function() {
            var anyItem = $scope.singleSelection() || $scope.temps[0];
            if (anyItem && validateSamePath(anyItem)) {
                $scope.apiMiddleware.apiHandler.error = $translate.instant('select_destination');
                return false;
            }
            $scope.apiMiddleware.move($scope.temps, $rootScope.selectedModalPath, $scope.fileNavigator.overwrite).then(function() {
                $scope.fileNavigator.refresh();
                $scope.modal('move', true);
                $scope.fileNavigator.overwrite = false;
            });
        };

        $scope.cancelMove = function() {
            $scope.fileNavigator.overwrite = false;
        };

        $scope.showRename = function() {
            if (!$scope.fileNavigator.canRename) {
                $scope.alert({message:'no_permission_title', args:{operation:$translate.instant('rename')}},
                    {message:'no_permission_text', args:{operation:$translate.instant('rename').toLowerCase()}});
                return;
            }
            $scope.modal('rename');
        };

        $scope.rename = function() {
            var item = $scope.singleSelection();
            var name = item.tempModel.name;
            var samePath = item.tempModel.path.join('') === item.model.path.join('');
            if (!name || (samePath && $scope.fileNavigator.fileNameExists(name))) {
                $scope.apiMiddleware.apiHandler.error = $translate.instant('error_invalid_filename');
                return false;
            }
            $scope.apiMiddleware.rename(item).then(function() {
                $scope.fileNavigator.refresh();
                $scope.modal('rename', true);
            });
        };

        $scope.cancelRename = function() {
            var item = $scope.singleSelection();
            item.tempModel.name = item.model.name;
            $scope.fileNavigator.overwrite = false;
        };

        $scope.newFolder = function() {
            if (!$scope.fileNavigator.canUpload) {
                $scope.alert({message:'no_permission_title', args:{operation:$translate.instant('new_folder')}},
                    {message:'no_permission_text', args:{operation:$translate.instant('createFilesOrFolders').toLowerCase()}});
                return;
            }
            $scope.modal('newfolder');
        };

        $scope.createFolder = function() {
            var item = $scope.singleSelection();
            var name = item.tempModel.name;
            if (!name || $scope.fileNavigator.fileNameExists(name)) {
                return $scope.apiMiddleware.apiHandler.error = $translate.instant('error_invalid_filename');
            }
            $scope.apiMiddleware.createFolder(item).then(function() {
                $scope.fileNavigator.refresh();
                $scope.modal('newfolder', true);
            });
        };

        $scope.cancelNewItem = function() {
            $scope.temps = [];
        };

        $scope.newFile = function() {
            if (!$scope.fileNavigator.canUpload) {
                $scope.alert({message:'no_permission_title', args:{operation:$translate.instant('new_file')}},
                    {message:'no_permission_text', args:{operation:$translate.instant('createFilesOrFolders').toLowerCase()}});
                return;
            }
            $scope.modal('newfile');
        };

        $scope.createFile = function() {
            var item = $scope.singleSelection();
            var name = item.tempModel.name;
            if (!name || $scope.fileNavigator.fileNameExists(name)) {
                return $scope.apiMiddleware.apiHandler.error = $translate.instant('error_invalid_filename');
            }
            $scope.apiMiddleware.createFile(item).then(function() {
                $scope.fileNavigator.refresh();
                $scope.modal('newfile', true);
            });
        };

        $scope.removeFromUpload = function(index) {
            $scope.uploadFileList.splice(index, 1);
        };

        $scope.alert = function(title, text) {
            $scope.message = {
                title: !title.message ? title : $translate.instant(title.message, title.args),
                text: !text.message ? text : $translate.instant(text.message, text.args)
            };
            $scope.modal('alert');
        };

        $scope.confirm = function(title, text, callback) {
            $scope.confirmCallback = callback;
            $scope.message = {
                title: !title.message ? title : $translate.instant(title.message, title.args),
                text: !text.message ? text : $translate.instant(text.message, text.args)
            };
            $scope.modal('confirm');
        };

        $scope.onConfirm = function(isConfirmed) {
            $scope.modal('confirm', true);
            $scope.confirmCallback(isConfirmed);
        };

        $scope.upload = function($files) {
            var files = [];
            if ($files) {
                $files.forEach(function(file) {
                    if (file instanceof File)
                        files.push(file);
                });
                if (files.length === 0)
                    return;
            }
            if (!$scope.fileNavigator.canUpload) {
                $scope.alert({message:'no_permission_title', args:{operation:$translate.instant('upload')}},
                    {message:'no_permission_text', args:{operation:$translate.instant('upload').toLowerCase()}});
                return;
            }
            $scope.uploadFileList = $scope.uploadFileList.concat(files);
            $scope.modal('uploadfile');
        };

        $scope.uploadFiles = function() {
            $scope.uploading = true;
            $scope.apiMiddleware.upload($scope.uploadFileList, $scope.fileNavigator.currentPath, $scope.fileNavigator.overwrite).then(function() {
                $scope.fileNavigator.refresh();
                $scope.uploadFileList = [];
                $scope.uploading = false;
                $scope.fileNavigator.overwrite = false;
                $scope.modal('uploadfile', true);
            }, function(data) {
                var errorMsg;
                if (data.code)
                    errorMsg = $translate.instant(data.code);
                else
                    errorMsg = data.result && data.result.error || $translate.instant('error_uploading_files');
                $scope.apiMiddleware.apiHandler.error = errorMsg;
                $scope.uploading = false;
                $scope.fileNavigator.overwrite = false;
            });
        };

        $scope.cancelUpload = function() {
            if (!$scope.uploading) {
                $scope.uploadFileList = [];
                $scope.fileNavigator.overwrite = false;
            }
        };

        $scope.getUrl = function(_item) {
            return $scope.apiMiddleware.getUrl(_item);
        };

        var validateSamePath = function(item) {
            var selectedPath = $rootScope.selectedModalPath.join('');
            var selectedItemsPath = item && item.model.path.join('');
            return selectedItemsPath === selectedPath;
        };

        var getQueryParam = function(param) {
            var found = $window.location.search.substr(1).split('&').filter(function(item) {
                return param ===  item.split('=')[0];
            });
            return found[0] && found[0].split('=')[1] || undefined;
        };

        $scope.changeLanguage(getQueryParam('lang'));
        $scope.isWindows = getQueryParam('server') === 'Windows';
        $scope.fileNavigator.refresh();

    }]);
})(angular);
