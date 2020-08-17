const AUTH = '4447';

class Server {
    /**
     * Get a file
     * @param  {String}  filename   The file to get
     * @param  {Boolean} isJson     Is the file JSON?
     * @return {Promise}            Promise for fetching file
     */
    static async getFile(filename, isJson = false) {
        if (isJson) filename += '.json';

        return new Promise((resolve, reject) => {
            let http = new XMLHttpRequest();
            http.open('POST', 'server/getFile.php');
            http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            http.onload = () => {
                let response = http.response;
                if (response.match(/E[0-9]{3}/)) {
                    reject(response);
                } else {
                    if (isJson) {
                        try {
                            response = JSON.parse(response);
                        } catch (e) {
                            return reject('Malformed JSON');
                        }
                    }
                    resolve(response);
                }
            };
            http.send("auth=" + AUTH + "&filename=" + filename);
        });
    }

    /**
     * Put contents in a file
     * @param  {String}  filename   The file to insert in to
     * @param  {String}  contents   The contents
     * @return {Promise}            Promise for putting file
     */
    static async putFile(filename, contents) {
        return new Promise((resolve, reject) => {
            let http = new XMLHttpRequest();
            http.open('POST', 'server/putFile.php');
            http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            http.onload = () => {
                if (http.response.match(/E[0-9]{3}/)) {
                    reject(http.response);
                } else {
                    resolve(http.response);
                }
            };
            http.send("auth=" + AUTH + "&filename=" + filename + "&contents=" + contents);
        });
    }

    /**
     * Create a file
     * @param  {String}  filename       The file to create
     * @param  {String}  [contents='']  The contents to insert
     * @return {Promise}                Promise for creating file
     */
    static async createFile(filename, contents = '') {
        return new Promise((resolve, reject) => {
            let http = new XMLHttpRequest();
            http.open('POST', 'server/createFile.php');
            http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            http.onload = () => {
                if (http.response.match(/E[0-9]{3}/)) {
                    reject(http.response);
                } else {
                    resolve(http.response);
                }
            };
            http.send("auth=" + AUTH + "&filename=" + filename + "&contents=" + contents);
        });
    }

    /**
     * Delete a file
     * @param  {String}  filename       The file to delete
     * @return {Promise}                Promise for deleting file
     */
    static async deleteFile(filename) {
        return new Promise((resolve, reject) => {
            let http = new XMLHttpRequest();
            http.open('POST', 'server/deleteFile.php');
            http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            http.onload = () => {
                if (http.response.match(/E[0-9]{3}/)) {
                    reject(http.response);
                } else {
                    resolve(http.response);
                }
            };
            http.send("auth=" + AUTH + "&filename=" + filename);
        });
    }

}
