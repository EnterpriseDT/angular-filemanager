// Set to true if you want to use the full source-code (slow)
// Set to false if you want to use the minimized source-code (fast)
var developmentMode = false;

// Handles (1) the initial index page request, and (2) file downloads
function processRequest() {
    try {
        if (!request.query.download) {
            response.writeUsingTemplateFile("template.html", {
                developmentMode: developmentMode
            });
        } else {
            response.downloadFile = system.user.homeFolder + request.query.download;
            response.forceDownload = true;
        }
    } catch (e) {
        return {
            error: e
        };
    }
}

// Returns a list of the given directory
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

// Copies a file
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

// Moves a file
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

// Deletes a file
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

// this handles the upload by returning the path at which the file should be placed
function getUploadPath(fileName, contentType) {
    return system.user.homeFolder + "/" + fileName;
}

// Returns the contents of a file
function getContent(path) {
    var file = system.getFile(system.user.homeFolder + path);
    return file.readText(content);
}

// Writes the given content to a file
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

// Renames a file
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

// Creates a new folder
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

// Formats a date as required by the client-side code
function formatDate(date) {
    return date.getFullYear()
        + "-" + (date.getMonth()-1)
        + "-" + date.getDate()
        + " " + date.getHours()
        + ":" + date.getMinutes()
        + ":" + date.getSeconds()
}