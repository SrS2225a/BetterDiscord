/**
 * @name CustomUploader
 * @author Nyx
 * @authorId 270848136006729728
 * @version 1.0.0
 * @license MIT
 * @description Allows you to upload files to your own server or another host.
 * @website https://github.com/SrS2225a/BetterDiscord/tree/master/plugins/CustomUploader
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
            version: "1.0.0",
            description: "Allows you to upload files to your own server or another host."
        },
        github: "https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins",
        github_raw:"https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/Custom%20Uploader.plugin.js",
        defaultConfig: [
            // {
            //     "type": "dropdown",
            //     "name": "Destination Type",
            //     "id": "destinationType",
            //     "defaultValue": "Image Upload",
            //     "note": "The type of destination you want to use.",
            //     "value": "Image Upload",
            //     "options": [
            //         {
            //             label: "Image Upload",
            //             value: "Image Upload"
            //         },
            //         {
            //             label: "File Upload",
            //             value: "File Upload"
            //         },
            //         {
            //             label: "Text Upload",
            //             value: "Text Upload"
            //         },
            //         {
            //
            //         }
            //     ]
            // },
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
                "value": "{\"Authorization\": \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjI3MDg0ODEzNjAwNjcyOTcyOCIsImRhdGUiOiIyMDIwLTA3LTAyVDIxOjE5OjEzLjYyNloiLCJpYXQiOjE1OTM3MjQ3NTN9.ombFT9KmpYVMZIvZAd-VWoIhAyaYMTFm7HjyRITOKFA\"}",
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
                value: "url",
                note: "How the response URL should be parsed.\nExample: url"
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
    return !global.ZeresPluginLibrary

        ? class {
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
        : (([Plugin, Api]) => {
            const plugin = (Plugin, Library) => {
                const { Patcher, React, Modals, WebpackModules, ContextMenu, DiscordModules, Toasts} = { ...Api, ...BdApi };
                const {Dispatcher} = DiscordModules;
                const uploaderIcon = React.createElement("path", {
                    fill: "currentColor",
                    d: "M384 352v64c0 17.67-14.33 32-32 32H96c-17.67 0-32-14.33-32-32v-64c0-17.67-14.33-32-32-32s-32 14.33-32 32v64c0 53.02 42.98 96 96 96h256c53.02 0 96-42.98 96-96v-64c0-17.67-14.33-32-32-32S384 334.3 384 352zM201.4 9.375l-128 128c-12.51 12.51-12.49 32.76 0 45.25c12.5 12.5 32.75 12.5 45.25 0L192 109.3V320c0 17.69 14.31 32 32 32s32-14.31 32-32V109.3l73.38 73.38c12.5 12.5 32.75 12.5 45.25 0s12.5-32.75 0-45.25l-128-128C234.1-3.125 213.9-3.125 201.4 9.375z",
                });

                return class CustomUploader extends Plugin {
                    start() {
                        this.attachment = WebpackModules.find((m) => m.default?.displayName === "Attachment")
                        Dispatcher.subscribe("CHANNEL_SELECT", this.onChannelChange);
                        this.PatchContextMenu()
                        this.PatchFileMessage();
                        // addittonally... add a patch that allows you to drag and drop the file into discord, you could make it so that the file only gets sent to the upload service instead of discord, and instead you only send a link to the file
                    }

                    async upload(url) {
                        let data = [];
                        let options = {}
                        const https = require("https");
                        if (this.settings.uploaderBody === "FormData") {
                            const response = await request.get(url).on("data", (chunk) => {
                                data.push(Buffer.from(chunk));
                            }).on("end", () => {
                                options.formData = {custom_file: {value: Buffer.concat(data), options: {filename: url.split('/').pop(), contentType: response.headers["content-type"]}}}
                                options.url = this.settings.uploaderUrl;
                                options.method = this.settings.uploaderMethod;
                                options.headers = this.settings.uploaderHeaders ? JSON.parse(this.settings?.uploaderHeaders) : {};
                                options.paramaters = this.settings.uploaderParamaters ? JSON.parse(this.settings?.uploaderParamaters) : {};
                                uploadData(options, this.settings.uploaderResponseParser)
                            });
                        } else if (this.settings.uploaderBody === "FormURLEncoded") {
                            await request.get(url).on("data", (chunk) => {
                                data.push(Buffer.from(chunk));
                            }).on("end", () => {
                                options.form = {
                                    file: Buffer.concat(data),
                                };
                                options.url = this.settings.uploaderUrl;
                                options.method = this.settings.uploaderMethod;
                                options.headers = this.settings.uploaderHeaders ? JSON.parse(this.settings?.uploaderHeaders) : {};
                                options.paramaters = this.settings.uploaderParamaters ? JSON.parse(this.settings?.uploaderParamaters) : {};
                                uploadData(options, this.settings.uploaderResponseParser)
                            });
                        } else if (this.settings.uploaderBody === "XML") {
                            await request.get(url).on("data", (chunk) => {
                                data.push(Buffer.from(chunk));
                            }).on("end", () => {
                                options.multipart = [{body: Buffer.concat(data),  name: 'file', content_type: 'application/xml'}];
                                options.url = this.settings.uploaderUrl;
                                options.method = this.settings.uploaderMethod;
                                options.headers = this.settings.uploaderHeaders ? JSON.parse(this.settings?.uploaderHeaders) : {};
                                options.paramaters = this.settings.uploaderParamaters ? JSON.parse(this.settings?.uploaderParamaters) : {};
                                uploadData(options, this.settings.uploaderResponseParser)
                            });
                        } else if (this.settings.uploaderBody === "JSON") {
                            await request.get(url).on("data", (chunk) => {
                                data.push(Buffer.from(chunk));
                            }).on("end", () => {
                                options.multipart = [{body: Buffer.concat(data),  name: 'file', content_type: 'application/json'}];
                                options.url = this.settings.uploaderUrl;
                                options.method = this.settings.uploaderMethod;
                                options.headers = this.settings.uploaderHeaders ? JSON.parse(this.settings?.uploaderHeaders) : {};
                                options.paramaters = this.settings.uploaderParamaters ? JSON.parse(this.settings?.uploaderParamaters) : {};
                                uploadData(options, this.settings.uploaderResponseParser)
                            });
                        } else if (this.settings.uploaderBody === "Binary") {
                            await request.get(url).on("data", (chunk) => {
                                data.push(Buffer.from(chunk));
                            }).on("end", () => {
                                options.body = Buffer.concat(data);
                                options.url = this.settings.uploaderUrl;
                                options.method = this.settings.uploaderMethod;
                                options.headers = this.settings.uploaderHeaders ? JSON.parse(this.settings?.uploaderHeaders) : {};
                                options.paramaters = this.settings.uploaderParamaters ? JSON.parse(this.settings?.uploaderParamaters) : {};
                                uploadData(options, this.settings.uploaderResponseParser)
                            });
                        }

                        function uploadData(options, callback) {
                            console.log("\x1b[36m%s\x1b[0m", "[Custom Uploader] " + options.method + " " + options.url);
                            // replace fetch with request to advoid cros
                            request(options, function (error, response, body) {
                                console.log("\x1b[36m%s\x1b[0m", "[Custom Uploader] " + response.statusCode + " " + response.statusMessage);
                                if (response?.statusCode === 200) {
                                    // coverts a string like data.url to dot notation for the returned json
                                    function recompose(obj, string) {
                                        var parts = string.split('.');
                                        var newObj = obj[parts[0]];
                                        if (parts[1]) {
                                            parts.splice(0, 1);
                                            var newString = parts.join('.');
                                            return recompose(newObj, newString);
                                        }
                                        return newObj;
                                    }
                                    let url = recompose(JSON.parse(body), callback);
                                    if (url) {
                                        DiscordNative.clipboard.copy(url);
                                        Toasts.success(`File Uploaded Successfully as: ${url}. It has been copied to your clipboard.`);
                                    } else {
                                        Toasts.warning("File Uploaded Successfully, but no URL was returned. Please check your settings and try again.");
                                    }
                                } else {

                                    Toasts.error(`Failed To Upload File: ${response?.statusMessage}`);
                                }
                            });
                        }
                    }

                    PatchFileMessage() {
                        Patcher.after(
                            config.info.name,
                            this.attachment,
                            "default",
                            (_, [props], ret) => {
                                if (ret.props?.children?.length === 0 || !ret.props.children[2]?.props?.href) {return}
                                let button = React.createElement("svg", {
                                    class: "downloadButton-2HLFWN",
                                    width: "24",
                                    height: "24",
                                    viewBox: "-80 -80 640 640",
                                    // get blob / stream
                                    onClick: () => {this.upload(ret.props.children[2].props.href)}
                                }, uploaderIcon);

                                ret.props.children = [
                                    ...ret.props.children,
                                    button
                                ]
                            }
                        )
                    }


                    PatchContextMenu() {
                        ContextMenu.getDiscordMenu("MessageContextMenu").then(menu => {
                            Patcher.after(
                                config.info.name,
                                menu,
                                "default",
                                (_, [props], ret) => {
                                    if (props.message.attachments.length === 0) {return}
                                    const url = props.message.attachments[0].url;
                                    ret.props.children.splice(5, 0, ContextMenu.buildMenuItem({label: "Upload File", action: () => {this.upload(props.message.attachments[0].url)}}));
                                }
                            )
                        })
                    }

                    getSettingsPanel() {
                        const panel = this.buildSettingsPanel();
                        return panel.getElement();
                    }
                    stop() {
                        Dispatcher.unsubscribe("CHANNEL_SELECT", this.onChannelChange);
                        Patcher.unpatchAll(config.info.name);
                    }
                };
                return CustomUploader
            };
            return plugin(Plugin, Api);
        })(global.ZeresPluginLibrary.buildPlugin(config));
})();