/**
 * @name CustomUploader
 * @author Nyx
 *  @authorId 270848136006729728
 *  @version 1.0.0
 *  @license MIT
 *  @description A plugin that allows you to upload files to your own server or another host.
 */


const request = require("request");
module.exports = (() => {
    const config = {
        info: {
            name: "CustomUploader",
            authors: [
                {
                    name: "Nyx"
                }
            ],
            version: "1.0.0",
            description: "A plugin that allows you to upload files to your own server or another host."
        },
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
                value: "http://imgur.com/upload"
            },
            {
                "name": "Headers",
                "type": "textbox",
                "id": "uploaderHeaders",
                "note": "The headers to use for the upload.\nExample: {\"Content-Type\": \"text/plain\", \"X-Custom-Header\": \"Custom Value\"}",
            },
            {
                "name": "Parameters",
                "type": "textbox",
                "id": "uploaderParameters",
                "note": "The parameters to use for the upload.\nExample: { \"param1\": \"value1\", \"param2\": \"value2\" }",
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
                "use strict";
                const { Patcher, React, Modals, WebpackModules, ContextMenu, DiscordModules, Toasts} = { ...Api, ...BdApi };
                const {Dispatcher} = DiscordModules;
                const uploaderIcon = React.createElement("path", {
                    fill: "currentColor",
                    d: "M384 352v64c0 17.67-14.33 32-32 32H96c-17.67 0-32-14.33-32-32v-64c0-17.67-14.33-32-32-32s-32 14.33-32 32v64c0 53.02 42.98 96 96 96h256c53.02 0 96-42.98 96-96v-64c0-17.67-14.33-32-32-32S384 334.3 384 352zM201.4 9.375l-128 128c-12.51 12.51-12.49 32.76 0 45.25c12.5 12.5 32.75 12.5 45.25 0L192 109.3V320c0 17.69 14.31 32 32 32s32-14.31 32-32V109.3l73.38 73.38c12.5 12.5 32.75 12.5 45.25 0s12.5-32.75 0-45.25l-128-128C234.1-3.125 213.9-3.125 201.4 9.375z",
                });

                return class CustomUploader extends Plugin {
                    start() {
                        Dispatcher.subscribe("CHANNEL_SELECT", this.onChannelChange);
                        this.PatchContextMenu()
                        this.PatchFileMessage();

                    }

                    async upload(url) {
                        let data = null;
                        if (this.settings.uploaderBody === "FormData") {
                            data = new FormData();
                            data.append("image", await fetch(url).then(response => response.blob()));
                            data = formData
                        } else if (this.settings.uploaderBody === "FormURLEncoded") {
                            data = new URLSearchParams();
                            data.append("image", await fetch(url).then(response => response.blob()));
                        } else if (this.settings.uploaderBody === "XML") {
                            data = new XMLSerializer().serializeToString(await fetch(url).then(response => response.blob()));
                        } else if (this.settings.uploaderBody === "JSON") {
                            data = {
                                image: await fetch(url).then(response => response.blob())
                            }
                        } else if (this.settings.uploaderBody === "Binary") {
                            data = await fetch(url).then(response => response.blob());
                        } else {
                            data = await fetch(url);
                        }

                        let options = {}
                        options.method = this.settings.uploaderMethod;
                        options.headers = this.settings.uploaderHeaders ? JSON.parse(this.settings?.uploaderHeaders) : {};
                        options.paramaters = this.settings.uploaderParamaters ? JSON.parse(this.settings?.uploaderParamaters) : {};
                        options.body = data;
                        let response = await fetch(this.settings.uploaderUrl, options).catch(err => {
                            Modals.showAlertModal("Cannot Upload Your File", `${err.message}\n\nPlease check your settings and try again.`);
                        });
                        if (response.ok) {
                            const url = await response?.json().url;
                            navigator.clipboard.write(url);
                            Toasts.success(`File Uploaded Successfully as: ${url}. It has been coppyed to your clipboard.`);
                        } else {
                            Toasts.error(`Failed To Upload File: ${response.statusText}`);
                        }
                    }

                    PatchFileMessage() {
                        Patcher.after(
                            config.info.name,
                            WebpackModules.find((m) => m.default?.displayName === "Attachment"),
                            "default",
                            (_, [props], ret) => {
                                if (ret.props?.children?.length === 0 || !ret.props.children[2]?.props?.href) {return}
                                let button = React.createElement("svg", {
                                    class: "downloadButton-2HLFWN",
                                    width: "24",
                                    height: "24",
                                    viewBox: "-80 -80 642 642",
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