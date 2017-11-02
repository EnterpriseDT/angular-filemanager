function processRequest() {
    try {
        // console.log("Request = " + JSON.stringify(request));
        if (request.query.download) {
            response.downloadFile = system.user.homeFolder + request.query.download;
            response.forceDownload = true;
        } else  
            response.writeUsingTemplateFile("template.html", {
                homeFolder: system.user.homeFolder
            });
    } catch (e) {
        return {
            error: e
        };
    }
}

function list(path, fileExtensions) {
    var items = [];
    var files = system.getFile(system.user.homeFolder + path).getFiles();
    for (var i in files) {
        var file = files[i];
        items.push({
            name: file.name,
            rights: "drwxr-xr-x",
            size: file.length,
            date: formatDate(file.modifiedTime),
            type: file.isFile ? "file" : "dir"
        })
    }
    return items;
}
function copy(paths, toPath, singleFilename) {
    try {
        if (paths.length == 1)
            toPath += "/" + singleFilename;
        for (var i in paths) {
            var path = paths[i];
            var file = system.getFile(system.user.homeFolder + path);
            file.copyTo(system.user.homeFolder + toPath);
        }
        return {
            success: true,
            error: null
        }
    } catch (e) {
        return {
            success: false,
            error: e
        }
    }
}

function move(paths, toPath) {
    try {
        for (var i in paths) {
            var path = paths[i];
            var file = system.getFile(system.user.homeFolder + path);
            file.moveTo(system.user.homeFolder + toPath);
        }
        return {
            success: true,
            error: null
        }
    } catch (e) {
        return {
            success: false,
            error: e
        }
    }
}

function remove(paths) {
    try {
        for (var i in paths) {
            var path = paths[i];
            var file = system.getFile(system.user.homeFolder + path);
            file.remove();
        }
        return {
            success: true,
            error: null
        }
    } catch (e) {
        return {
            success: false,
            error: e
        }
    }
}

// this handles the upload
function getUploadPath(fileName, contentType) {
    console.log(system.user.homeFolder + "/" + fileName);
    return system.user.homeFolder + "/" + fileName;
}

function getContent(path) {
    var file = system.getFile(system.user.homeFolder + path);
    return file.readText(content);
}

function edit(path, content) {
    try {
        var file = system.getFile(system.user.homeFolder + path);
        file.writeText(content);
        return {
            success: true,
            error: null
        }
    } catch (e) {
        return {
            success: false,
            error: e
        }
    }
}

function rename(fromPath, toPath) {
    try {
        var file = system.getFile(system.user.homeFolder + fromPath);
        file.moveTo(system.user.homeFolder + toPath);
        return {
            success: true,
            error: null
        }
    } catch (e) {
        return {
            success: false,
            error: e
        }
    }
}

function createFolder(path) {
    try {
        var file = system.getFile(system.user.homeFolder + path);
        file.createFolder();
        return {
            success: true,
            error: null
        }
    } catch (e) {
        return {
            success: false,
            error: e
        }
    }
}

function formatDate(date) {
    return date.getFullYear()
        + "-" + (date.getMonth()-1)
        + "-" + date.getDate()
        + " " + date.getHours()
        + ":" + date.getMinutes()
        + ":" + date.getSeconds()
}