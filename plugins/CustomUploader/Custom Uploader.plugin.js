/**
 * @name CustomUploader
 * @author Nyx
 * @authorId 270848136006729728
 * @version 1.0.0
 * @license MIT
 * @description Allows you to upload files to your own server or another host.
 * @website https://github.com/SrS2225a
 * @source https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/Custom%20Uploader.plugin.js
 * @updateUrl https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/Custom%20Uploader.plugin.js
 */

const request = require("request");
module.exports = (() => {
    const config = {
        info: {
            name: "CustomUploader",
            authors: [
                {
                    name: "Nyx",
                    discord_id: "27048136006729728",
                }
            ],
            version: "1.3.3",
            description: "Allows you to upload files to your own server or another host."
        },
        github: "https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins",
        github_raw:"https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/Custom%20Uploader.plugin.js",
        changelog: [
            {
                title: "Changes",
                items: [`Moved "upoad using uploader service" setting option to attachment buttons popover.`]
            }
        ],
        main: "index.js",
        defaultConfig: [
            {
                type: "textbox",
                id: "uploaderUrl",
                name: "URL",
                note: "The URL to upload to.\nExample: https://example.com/upload.php",
                value: "https://hep.gg/upload"
            },
            {
                "name": "Headers",
                "type": "textbox",
                "id": "uploaderHeaders",
                "value": "{\"Authorization\": \"<your token here>\"}",
                "note": "The headers to use for the upload.\nExample: {\"Content-Type\": \"text/plain\", \"X-Custom-Header\": \"Custom Value\"}",
            },
            {
                "name": "Parameters",
                "type": "textbox",
                "id": "uploaderParameters",
                "note": "The parameters to use for the upload.\nExample: { \"param1\": \"value1\", \"param2\": \"value2\" }",
            },
            {
                name: "URL Response",
                type: "textbox",
                id: "uploaderResponseParser",
                value: "$json:url",
                note: "The response to parse from the uploader.\nExample: $json:data.url",
            },
            {
                name: "Error Response",
                type: "textbox",
                id: "uploaderErrorParser",
                value: "$json:error",
                note: "The error response to parse from the uploader.\nExample: $json:error.message",
            },
            {
                type: "dropdown",
                id: "uploaderMethod",
                name: "Method",
                note: "The method to use for the upload.",
                value: "POST",
                options: [
                    {
                        label: "POST",
                        value: "POST"
                    },
                    {
                        label: "GET",
                        value: "GET"
                    },
                    {
                        label: "PUT",
                        value: "PUT"
                    },
                    {
                        label: "PATCH",
                        value: "PATCH"
                    },
                    {
                        label: "DELETE",
                        value: "DELETE"
                    }
                ]

            },
            {
                type: "dropdown",
                id: "uploaderBody",
                name: "Body",
                note: "The body to use for the upload.",
                value: "FormData",
                options: [
                    {
                        label: "No Body",
                        value: "NoBody"
                    },
                    {
                        label: "Binary",
                        value: "Binary"
                    },
                    {
                        label: "JSON",
                        value: "JSON"
                    },
                    {
                        label: "XML",
                        value: "XML"
                    },
                    {
                        label: "Form URL Encoded",
                        value: "FormURLEncoded"
                    },
                    {
                        label: "Form Data",
                        value: "FormData"
                    }
                ]
            }
        ]
    };
    return !global.ZeresPluginLibrary ? class {
            constructor() {
                this._config = config;
            }
            getName() {
                return config.info.name;
            }
            getAuthor() {
                return config.info.authors.map((a) => a.name).join(", ");
            }
            getDescription() {
                return config.info.description;
            }
            getVersion() {
                return config.info.version;
            }
            load() {
                BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
                    confirmText: "Download Now",
                    cancelText: "Cancel",
                    onConfirm: () => {
                        request.get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                            if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                            await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                        });
                    }
                });
            }
            start() {}
            stop() {}
        }
        : (([Plugin, Library]) => {
            const plugin = (Plugin, Library) => {
                const { Patcher, WebpackModules, ContextMenu, DiscordModules, Toasts, PluginUtilities } = Library;
                const {Dispatcher, React} = DiscordModules;
                const uploaderIcon = React.createElement("path", {
                    fill: "currentColor",
                    d: "M384 352v64c0 17.67-14.33 32-32 32H96c-17.67 0-32-14.33-32-32v-64c0-17.67-14.33-32-32-32s-32 14.33-32 32v64c0 53.02 42.98 96 96 96h256c53.02 0 96-42.98 96-96v-64c0-17.67-14.33-32-32-32S384 334.3 384 352zM201.4 9.375l-128 128c-12.51 12.51-12.49 32.76 0 45.25c12.5 12.5 32.75 12.5 45.25 0L192 109.3V320c0 17.69 14.31 32 32 32s32-14.31 32-32V109.3l73.38 73.38c12.5 12.5 32.75 12.5 45.25 0s12.5-32.75 0-45.25l-128-128C234.1-3.125 213.9-3.125 201.4 9.375z",
                });

                // can parse as regex, json, or xml
                // with support for adding variables to the url or other data
                // for example: if the response only gives back something such as {"id":"WQYX5"}, we can use https://i.imgur.com/$json:id to get the url
                // or if we have the full url, then we can use something like $json:data.url
                // an $ character tells the parser where the value should be expected
                function parseResponse(response, string) {
                    const parseAs = string.split("$")
                    const values = []
                    for (const part of parseAs) {
                        const fromJson = function (object, reference) {
                            function arr_deref(o, ref, i) {
                                return !ref ? o : (o[(ref.slice(0, i ? -1 : ref.length)).replace(/^['"]|['"]$/g, '')]);
                            }

                            function dot_deref(o, ref) {
                                return ref.split('[').reduce(arr_deref, o || "");
                            }

                            return !reference ? object : reference.split('.').reduce(dot_deref, object);
                        };

                        if (part.startsWith("json:")) {
                            const json = part.split("json:")[1];
                            values.push(fromJson(JSON.parse(response), json));
                        } else if (part.startsWith("xml:")) {
                            const xml = parseAs[1].split("xml:")[1];
                            function xmlToJson(xml) {
                                var obj = {};

                                if (xml.nodeType === 1) {
                                    if (xml.attributes.length > 0) {
                                        obj["@attributes"] = {};
                                        for (var j = 0; j < xml.attributes.length; j++) {
                                            var attribute = xml.attributes.item(j);
                                            obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
                                        }
                                    }
                                } else if (xml.nodeType === 3) {
                                    obj = xml.nodeValue;
                                }

                                if (xml.hasChildNodes()) {
                                    for (var i = 0; i < xml.childNodes.length; i++) {
                                        var item = xml.childNodes.item(i);
                                        var nodeName = item.nodeName;
                                        if (item.nodeType === 3 && item.nodeValue.trim().length > 0) {
                                            obj = item.nodeValue.trim();
                                        } else if (item.nodeType === 1) {
                                            if (typeof (obj[nodeName]) == "undefined") {
                                                obj[nodeName] = xmlToJson(item);
                                            } else {
                                                if (typeof (obj[nodeName].push) == "undefined") {
                                                    var old = obj[nodeName];
                                                    obj[nodeName] = [];
                                                    obj[nodeName].push(old);
                                                }
                                                obj[nodeName].push(xmlToJson(item));
                                            }
                                        }
                                    }
                                }
                                return obj;
                            }
                            const xmlDoc = new DOMParser().parseFromString(response, "text/xml");
                            values.push(fromJson(xmlToJson(xmlDoc), xml));
                        } else if (part.startsWith("regex:")) {
                            const regex = parseAs[1].split(":")[1];
                            const regexes = regex.split("//|");
                            const regexesRegex = new RegExp(regexes[0], "g");
                            const regexesMatch = regexesRegex.exec(response);
                            values.push(regexesMatch[parseInt(regexes[1] - 1, 10) || 0]);
                        } else {
                            values.push(part);
                        }
                    }
                    return values.join("");
                }

                return class CustomUploader extends Plugin {
                    onStart() {
                        this.attachment = WebpackModules.find((m) => m.default?.displayName === "Attachment")
                        this.fileUploadMod = WebpackModules.getByProps("instantBatchUpload", "upload");
                        this.MessageUtils = WebpackModules.getByProps("sendMessage", "_sendMessage");
                        this.draft = WebpackModules.getByProps("getDraft");
                        this.MiniPopover = WebpackModules.find((m) => m?.default?.displayName === "MiniPopover")
                        this.TooltipWrapper = WebpackModules.getByPrototypes("renderTooltip")
                        Dispatcher.subscribe("CHANNEL_SELECT");

                        Patcher.after(
                            this.attachment,
                            "default",
                            (_, [props], ret) => {
                                if (ret.props?.children?.length === 0 || !ret.props.children[2]?.props?.href) {return}
                                let button = React.createElement("svg", {
                                    class: "downloadButton-2HLFWN",
                                    width: "24",
                                    height: "24",
                                    viewBox: "-80 -80 640 640",
                                    onClick: () => {this.upload(ret.props.children[2].props.href)}
                                }, uploaderIcon);

                                ret.props.children = [
                                    ...ret.props.children,
                                    button
                                ]
                            }
                        )


                        Patcher.after(this.MiniPopover, "default", (_, args, ret) => {
                            if (!(args[0].children && args[0].children.props) || ret.props.children.props.children.length > 3) return;
                            // add toggle button for this.settings.uploader
                            let button = React.createElement(this.TooltipWrapper, {
                                position: this.TooltipWrapper.Positions.TOP,
                                color: this.TooltipWrapper.Colors.PRIMARY,
                                text: "Upload Using Upload Service",
                                children: (tipProps) => {
                                    if (this.settings.uploader) {
                                        return React.createElement(this.MiniPopover.Button, Object.assign({
                                            children: [
                                                React.createElement("svg", {
                                                    onClick: () => {
                                                        this.settings.uploader = false
                                                        PluginUtilities.saveData(config.info.name, "settings", this.settings);
                                                    },
                                                    viewBox: "-20 -40 640 640",
                                                }, React.createElement("path", {
                                                    fill: "currentColor",
                                                    d: "M172.5 131.1C228.1 75.51 320.5 75.51 376.1 131.1C426.1 181.1 433.5 260.8 392.4 318.3L391.3 319.9C381 334.2 361 337.6 346.7 327.3C332.3 317 328.9 297 339.2 282.7L340.3 281.1C363.2 249 359.6 205.1 331.7 177.2C300.3 145.8 249.2 145.8 217.7 177.2L105.5 289.5C73.99 320.1 73.99 372 105.5 403.5C133.3 431.4 177.3 435 209.3 412.1L210.9 410.1C225.3 400.7 245.3 404 255.5 418.4C265.8 432.8 262.5 452.8 248.1 463.1L246.5 464.2C188.1 505.3 110.2 498.7 60.21 448.8C3.741 392.3 3.741 300.7 60.21 244.3L172.5 131.1zM467.5 380C411 436.5 319.5 436.5 263 380C213 330 206.5 251.2 247.6 193.7L248.7 192.1C258.1 177.8 278.1 174.4 293.3 184.7C307.7 194.1 311.1 214.1 300.8 229.3L299.7 230.9C276.8 262.1 280.4 306.9 308.3 334.8C339.7 366.2 390.8 366.2 422.3 334.8L534.5 222.5C566 191 566 139.1 534.5 108.5C506.7 80.63 462.7 76.99 430.7 99.9L429.1 101C414.7 111.3 394.7 107.1 384.5 93.58C374.2 79.2 377.5 59.21 391.9 48.94L393.5 47.82C451 6.731 529.8 13.25 579.8 63.24C636.3 119.7 636.3 211.3 579.8 267.7L467.5 380z",
                                                }))
                                            ]
                                        }, tipProps))
                                    } else {
                                        return React.createElement(this.MiniPopover.Button, Object.assign({
                                            children: [
                                                React.createElement("svg", {
                                                    onClick: () => {
                                                        this.settings.uploader = true
                                                        PluginUtilities.saveData(config.info.name, "settings", this.settings);
                                                    },
                                                    viewBox: "-20 -40 640 640",
                                                }, React.createElement("path", {
                                                    fill: "currentColor",
                                                    d: "M185.7 120.3C242.5 75.82 324.7 79.73 376.1 131.1C420.1 175.1 430.9 239.6 406.7 293.5L438.6 318.4L534.5 222.5C566 191 566 139.1 534.5 108.5C506.7 80.63 462.7 76.1 430.7 99.9L429.1 101C414.7 111.3 394.7 107.1 384.5 93.58C374.2 79.2 377.5 59.21 391.9 48.94L393.5 47.82C451 6.732 529.8 13.25 579.8 63.24C636.3 119.7 636.3 211.3 579.8 267.7L489.3 358.2L630.8 469.1C641.2 477.3 643.1 492.4 634.9 502.8C626.7 513.2 611.6 515.1 601.2 506.9L9.196 42.89C-1.236 34.71-3.065 19.63 5.112 9.196C13.29-1.236 28.37-3.065 38.81 5.112L185.7 120.3zM238.1 161.1L353.4 251.7C359.3 225.5 351.7 197.2 331.7 177.2C306.6 152.1 269.1 147 238.1 161.1V161.1zM263 380C233.1 350.1 218.7 309.8 220.9 270L406.6 416.4C357.4 431 301.9 418.9 263 380V380zM116.6 187.9L167.2 227.8L105.5 289.5C73.99 320.1 73.99 372 105.5 403.5C133.3 431.4 177.3 435 209.3 412.1L210.9 410.1C225.3 400.7 245.3 404 255.5 418.4C265.8 432.8 262.5 452.8 248.1 463.1L246.5 464.2C188.1 505.3 110.2 498.7 60.21 448.8C3.741 392.3 3.741 300.7 60.21 244.3L116.6 187.9z",
                                                }))
                                            ]
                                        }, tipProps))
                                    }
                                }
                            })

                            // if exists, replace with new button
                            if (ret.props.children.props.children[3]) {
                                ret.props.children.props.children = button;
                            } else {
                                ret.props.children.props.children.push(button)
                            }
                        })


                        ContextMenu.getDiscordMenu("MessageContextMenu").then(menu => {
                            Patcher.after(
                                menu,
                                "default",
                                (_, [props], ret) => {
                                    const url = props.attachment?.url;
                                    if (typeof url === "undefined") {return}
                                    ret.props.children.splice(5, 0, ContextMenu.buildMenuItem({label: "Upload File", action: () => {this.upload(url)}}, true))
                                }
                            )
                        })
                        Patcher.instead(
                            this.fileUploadMod,
                            "uploadFiles",
                            (_, props, ret) => {
                                const {channelId, uploads} = props[0];
                                if (!this.settings.uploader) {
                                    ret(...props);
                                } else {
                                    const draft = this.draft.getDraft(channelId, 0);
                                    this.fileUpload(uploads, channelId, draft);
                                }
                            }
                        )
                    }

                    async upload(url) {
                        let data = [];
                        let options = {}
                        // let user know that thier file is being uploaded
                        Toasts.info(`Uploading to ${this.settings.uploaderUrl} ...`);
                        console.log("\x1b[36m%s\x1b[0m", "[Custom Uploader] " + this.settings.uploaderMethod + " " + this.settings.uploaderUrl);
                        const response = await request.get(url).on("data", (chunk) => {
                            data.push(Buffer.from(chunk));
                        }).on("end", () => {
                            if (this.settings.uploaderBody === "FormData") {options.formData = {custom_file: {value: Buffer.concat(data), options: {filename: url.split('/').pop(), contentType: response.response.headers["content-type"]}}}}
                            else if (this.settings.uploaderBody === "FormURLEncoded") {options.form = {file: Buffer.concat(data)}}
                            else if (this.settings.uploaderBody === "JSON") {options.multipart = [{body: Buffer.concat(data),  name: 'file', content_type: 'application/json'}]}
                            else if (this.settings.uploaderBody === "XML") {options.multipart = [{body: Buffer.concat(data),  name: 'file', content_type: 'application/xml'}]}
                            else if (this.settings.uploaderBody === "Binary") {options.body = Buffer.concat(data)}
                            options.url = this.settings.uploaderUrl;
                            options.method = this.settings.uploaderMethod;
                            options.headers = this.settings.uploaderHeaders ? JSON.parse(this.settings?.uploaderHeaders) : {};
                            options.paramaters = this.settings.uploaderParamaters ? JSON.parse(this.settings?.uploaderParamaters) : {};
                            uploadData(options, this.settings?.uploaderResponseParser, this.settings.uploaderErrorParser);
                        });


                        function uploadData(options, callback, errorCallback) {
                            request(options, function (error, response, body) {
                                console.log("\x1b[36m%s\x1b[0m", "[Custom Uploader] " + response.statusCode + " " + response.statusMessage);
                                console.log("\x1b[36m%s\x1b[0m", "[Custom Uploader] " +  body.toString());
                                if (response?.statusCode === 200 || response?.statusCode === 201 || response?.statusCode === 202) {
                                    const url = parseResponse(body, callback);
                                    if (url) {
                                        DiscordNative.clipboard.copy(url);
                                        Toasts.success(`File Uploaded Successfully as: ${url}. It has been copied to your clipboard.`);
                                    } else {
                                        Toasts.success(`File Uploaded Successfully.`);
                                    }
                                } else {
                                    Toasts.error(`Failed To Upload File: ${parseResponse(body, errorCallback) || response.statusMessage}`);
                                }
                            });
                        }
                    }

                    fileUpload(files, channelId, draft) {
                        const message = this.MessageUtils
                        let urls = [];
                        let options = {}
                        let n = 0;
                        Toasts.info(`Uploading to ${this.settings.uploaderUrl} ...`);
                        console.log("\x1b[36m%s\x1b[0m", "[Custom Uploader] " + this.settings.uploaderMethod + " " + this.settings.uploaderUrl);
                        for (const file of files) {
                            file.item.file.arrayBuffer().then(buffer => {
                                const data = Buffer.from(buffer);
                                if (this.settings.uploaderBody === "FormData") {options.formData = {custom_file: {value: data, options: {filename: file.item.file.name, contentType: file.item.file.type}}}}
                                else if (this.settings.uploaderBody === "FormURLEncoded") {options.form = {file: Buffer.concat(data)}}
                                else if (this.settings.uploaderBody === "JSON") {options.multipart = [{body: Buffer.concat(data),  name: 'file', content_type: 'application/json'}]}
                                else if (this.settings.uploaderBody === "XML") {options.multipart = [{body: Buffer.concat(data),  name: 'file', content_type: 'application/xml'}]}
                                else if (this.settings.uploaderBody === "Binary") {options.body = Buffer.concat(data)}
                                options.url = this.settings.uploaderUrl;
                                options.method = this.settings.uploaderMethod;
                                options.headers = this.settings.uploaderHeaders ? JSON.parse(this.settings?.uploaderHeaders) : {};
                                options.paramaters = this.settings.uploaderParamaters ? JSON.parse(this.settings?.uploaderParamaters) : {};
                                const callback = this.settings?.uploaderResponseParser
                                const errorCallback = this.settings?.uploaderErrorParser
                                request(options, function (error, response, body) {
                                    n++;
                                    console.log("\x1b[36m%s\x1b[0m", "[Custom Uploader] " + response.statusCode + " " + response.statusMessage);
                                    console.log("\x1b[36m%s\x1b[0m", "[Custom Uploader] " +  body.toString());
                                    if (response?.statusCode === 200 || response?.statusCode === 201 || response?.statusCode === 202) {
                                        const url = parseResponse(body, callback)
                                        if (url) {
                                            urls.push(url);
                                        } else {
                                            urls.push(file.item.file.name);
                                        }
                                    } else {
                                        Toasts.error(`Failed To Upload File ${n}: ${parseResponse(body, errorCallback) || response?.statusMessage}`);
                                    }
                                    if (n === files.length) {
                                        after_upload(urls);
                                    }
                                })
                            });
                        }
                        function after_upload(urls) {
                            if (urls.length > 0) {
                                message.sendMessage(channelId, {content: draft + "\n" + urls.join("\n")});
                            }
                            Toasts.success(`${urls.length} Files Uploaded Successfully.`);
                        }
                    }

                    getSettingsPanel() {
                        // const settings = this.buildSettingsPanel();
                        return this.buildSettingsPanel().getElement();
                    }

                    onStop() {
                        Dispatcher.unsubscribe("CHANNEL_SELECT");
                        Patcher.unpatchAll(config.info.name);
                    }
                };
            };
            return plugin(Plugin, Library);
        })(global.ZeresPluginLibrary.buildPlugin(config));
})();
