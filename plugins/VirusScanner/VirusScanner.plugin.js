/**
 * @name VirusScanner
 * @author Nyx
 * @authorId 270848136006729728
 * @version 1.0.0
 * @license MIT
 * @description Uses hybrids-analysis's technology to scan for viruses in files.
 * @website https://nyxgoddess.org/
 * @source https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/VirusScanner.plugin.js
 * @updateUrl https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/VirusScanner.plugin.js
 */

const request = require("request");
module.exports = (() => {
    const config = {
        info: {
            name: "VirusScanner",
            authors: [
                {
                    name: "Nyx",
                    discord_id: "27048136006729728",
                }
            ],
            version: "1.0.0",
            description: "Uses hybrids-analysis's technology to scan for viruses in files.",
        },
        github: "https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins",
        github_raw:"https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/VirusScanner.plugin.js",
        main: "index.js",
        defaultConfig: [
            {
                type: "switch",
                id: "fullReport",
                name: "Full Report",
                value: false,
                note: "When enabled, the plugin will show a full report of the scan. When disabled, it will only show the verdict."
            },
            {
                type: "switch",
                name: "Share Samples With Third Parties",
                note: "The plugin itself does not share any data with any parties, this is just for the api with Hybrid-Analysis",
                id: "thirdPartiesShare",
                value: true,

            },
            {
                type: "switch",
                name: "Allow Community Access To Samples",
                id: "communityAccess",
                value: false
            },
            {
                type: "textbox",
                id: "apiKey",
                name: "API Key",
                note: "The API key you get from Hybrid Analysis. You can get one at https://www.hybrid-analysis.com/my-account?tab=%23api-key-tab",
            },
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
                const { Patcher, WebpackModules, ContextMenu, DiscordModules, Toasts, DOMTools, Modals } = Library;
                const {Dispatcher, React} = DiscordModules;
                const attachment = WebpackModules.find((m) => m.default?.displayName === "Attachment")
                const uploaderIcon = React.createElement("path", {
                    fill: "currentColor",
                    d: "M352 96V99.56C352 115.3 339.3 128 323.6 128H188.4C172.7 128 159.1 115.3 159.1 99.56V96C159.1 42.98 202.1 0 255.1 0C309 0 352 42.98 352 96zM41.37 105.4C53.87 92.88 74.13 92.88 86.63 105.4L150.6 169.4C151.3 170 151.9 170.7 152.5 171.4C166.8 164.1 182.9 160 199.1 160H312C329.1 160 345.2 164.1 359.5 171.4C360.1 170.7 360.7 170 361.4 169.4L425.4 105.4C437.9 92.88 458.1 92.88 470.6 105.4C483.1 117.9 483.1 138.1 470.6 150.6L406.6 214.6C405.1 215.3 405.3 215.9 404.6 216.5C410.7 228.5 414.6 241.9 415.7 256H480C497.7 256 512 270.3 512 288C512 305.7 497.7 320 480 320H416C416 344.6 410.5 367.8 400.6 388.6C402.7 389.9 404.8 391.5 406.6 393.4L470.6 457.4C483.1 469.9 483.1 490.1 470.6 502.6C458.1 515.1 437.9 515.1 425.4 502.6L362.3 439.6C337.8 461.4 306.5 475.8 272 479.2V240C272 231.2 264.8 224 255.1 224C247.2 224 239.1 231.2 239.1 240V479.2C205.5 475.8 174.2 461.4 149.7 439.6L86.63 502.6C74.13 515.1 53.87 515.1 41.37 502.6C28.88 490.1 28.88 469.9 41.37 457.4L105.4 393.4C107.2 391.5 109.3 389.9 111.4 388.6C101.5 367.8 96 344.6 96 320H32C14.33 320 0 305.7 0 288C0 270.3 14.33 256 32 256H96.3C97.38 241.9 101.3 228.5 107.4 216.5C106.7 215.9 106 215.3 105.4 214.6L41.37 150.6C28.88 138.1 28.88 117.9 41.37 105.4H41.37z",
                });
                let scanning = []


                function setAttachmentShim(location, url, text) {
                    // use dom tools
                    const attachmentShim = DOMTools.createElement(`<div class="attachment-shim" style="text-decoration: underline"><a class="attachment-shim-link" href="${url}" target="_blank">${text}</a></div>`)
                    // get all attachments with the class messageAttachment-CZp8Iv
                    const attachments = document.getElementsByClassName("messageAttachment-CZp8Iv")

                    for (let i = 0; i < attachments.length; i++) {
                        // get the attachment
                        const attachment = attachments[i]
                        // get the attachment's children
                        const children = attachment.children
                        // find a element "a" in the tree
                        const a = attachment.querySelector("a")
                        if (a) {
                            // get the href
                            const href = a.getAttribute("href")
                            // check if the href is the same as the url
                            if (href === location) {
                                // always replace the attachment shim if it already exists
                                if (attachment.querySelector(".attachment-shim")) {
                                    attachment.querySelector(".attachment-shim").remove()
                                }
                                // add the shim
                                attachment.lastChild.appendChild(attachmentShim)
                                // break the loop
                                break
                            }
                        }
                    }
                }

                function removeAttachmentShim(location) {
                    // get all attachments with the class messageAttachment-CZp8Iv
                    const attachments = document.getElementsByClassName("messageAttachment-CZp8Iv")

                    for (let i = 0; i < attachments.length; i++) {
                        // get the attachment
                        const attachment = attachments[i]
                        // get the attachment's children
                        const children = attachment.children
                        // find a element "a" in the tree
                        const a = attachment.querySelector("a")
                        if (a) {
                            // get the href
                            const href = a.getAttribute("href")
                            // check if the href is the same as the url
                            if (href === location) {
                                // always replace the attachment shim if it already exists
                                if (attachment.querySelector(".attachment-shim")) {
                                    attachment.querySelector(".attachment-shim").remove()
                                }
                                // break the loop
                                break
                            }
                        }
                    }
                }

                class QuickScan {
                    constructor(url, settings) {
                        this.url = url
                        this.settings = settings
                        this.upload(url)
                    }

                    async upload(url) {
                        const settings = this.settings

                        async function finished(sha256) {
                            const headers = {
                                "accept": "application/json",
                                "content-type": "application/json",
                                "api-key": settings.apiKey,
                                "user-agent": "Falcon Sandbox",
                                "Content-Type": "application/x-www-form-urlencoded",
                            }
                            // we are done scanning, now we can show the results
                            await request.get({
                                url: `https://www.hybrid-analysis.com/api/v2/overview/${sha256}/summary`,
                                headers: headers
                            }, function (error, response, body) {
                                const json = JSON.parse(body)
                                if (response.statusCode === 200 || response.statusCode === 201) {
                                    setAttachmentShim(url, `https://www.hybrid-analysis.com/sample/${sha256}`, `Scan Complete. Threat Score: ${json.threat_score || 0}/100 (AV: ${json.multiscan_result}%) - ${json.verdict}`)
                                } else {
                                    scanFailed(json.message)
                                }

                            })
                        }

                        async function checkCompletion(id) {
                            // check if the scan is complete
                            const headers = {
                                "accept": "application/json",
                                "content-type": "application/json",
                                "api-key": settings.apiKey,
                                "user-agent": "Falcon Sandbox",
                                "Content-Type": "application/x-www-form-urlencoded",
                            }
                            await request.get({
                                // TODO: maybe use https://tria.ge/ instead, or option?
                                url: `https://www.hybrid-analysis.com/api/v2/quick-scan/${id}`,
                                headers: headers
                            }, async function (error, response, body) {
                                const json = JSON.parse(body)
                                if (response.statusCode === 201 || response.statusCode === 200) {
                                    if (json.finished) {
                                        await finished(json.sha256)
                                    } else {
                                        setTimeout(() => {
                                            checkCompletion(sha256, id)
                                        }, 10000)
                                    }
                                } else {
                                    scanFailed(json.message)
                                }

                            })
                        }

                        function scanFailed(message) {
                            Toasts.error(`Scan Failed: ${message}`)
                            removeAttachmentShim(url)
                            // we have failed to scan the file, so remove it from the scanning array
                            scanning.splice(scanning.indexOf(url), 1)
                        }

                        let options = {}
                        options.url = "https://www.hybrid-analysis.com/api/v2/quick-scan/url"
                        options.headers = {
                            "accept": "application/json",
                            "content-type": "application/json",
                            "api-key": settings.apiKey,
                            "user-agent": "Falcon Sandbox",
                        }
                        options.formData = {"scan_type": "all", "url": url, 'no_share_third_party': settings.thirdPartiesShare.toString(), "allow_community_access": settings.communityAccess.toString(), "comment": "This is a request by BetterDiscord for the plugin VirusScanner"}
                        options.method = "POST"
                        // start the scan
                        await request(options,  async function (error, response, body) {
                            const json = JSON.parse(body)
                            if (response.statusCode === 201 || response.statusCode === 200) {
                                Toasts.success("Scan started successfully")
                                setAttachmentShim(url, `https://www.hybrid-analysis.com/sample/${json.sha256}`, "Scanning... This may take some time.")
                                // get response body
                                if (json.finished) {
                                    await finished(json.sha256)
                                } else {
                                    setTimeout(() => {
                                        checkCompletion(sha256, id)
                                    }, 10000)
                                }
                            } else {
                                if (json.message) {
                                    scanFailed(json.message)
                                }
                            }
                        })
                    }
                }

                class FullScan {
                    constructor(url, settings) {
                        this.url = url
                        this.settings = settings
                        this.upload(url)
                    }

                    async upload(url) {
                        // add an array of OSes to scan in
                        const settings = this.settings
                        let dropdownOption = 120;
                        const components = [React.createElement("div", {
                            className: "form",
                            style: {
                                width: "100%",
                                color: "white",
                                marginBottom: "10px"
                            }
                        }, "Before we begin, please select an OS environment to scan in. This will determine what type of analysis is performed on the file. If you are unsure, select Windows 7 x64."), React.createElement(DiscordModules.Dropdown, {
                            onChange: (val) => {
                                dropdownOption = val
                            },
                            options: [
                                {
                                    label: "Windows 7 64 bit",
                                    value: 120
                                },
                                {
                                    label: "Windows 7 32 bit (HWP Support)",
                                    value: 110
                                }, {
                                    label: "Windows 7 32 bit",
                                    value: 100
                                }, {
                                    label: "Android Static Analysis",
                                    value: 200
                                }, {
                                    label: "Linux (Ubuntu 16.04, 64 bit)",
                                    value: 300
                                }
                            ],

                        })];

                        function scanFailed(message) {
                            Toasts.error(`Scan Failed: ${message}`)
                            removeAttachmentShim(url)
                            // we have failed to scan the file, so remove it from the scanning array
                            scanning.splice(scanning.indexOf(url), 1)
                        }

                        async function finished(sha256, id) {
                            // once the scan is finished, allow the user to get the report
                            const attachmentShim = DOMTools.createElement('<div class="attachment-shim"><span class="attachment-shim-link">"Scan Complete. Click to view results"</span></div>')
                            const attachments = document.getElementsByClassName("messageAttachment-CZp8Iv")
                            // loop through all attachments
                            for (let i = 0; i < attachments.length; i++) {
                                // get the attachment
                                const attachment = attachments[i]
                                // get the attachment's children
                                const children = attachment.children
                                // find a element "a" in the tree
                                const a = attachment.querySelector("a")
                                if (a) {
                                    // get the href
                                    const href = a.getAttribute("href")
                                    // check if the href is the same as the url
                                    if (href === url) {
                                        // always replace the attachment shim if it already exists
                                        if (attachment.querySelector(".attachment-shim")) {
                                            attachment.querySelector(".attachment-shim").remove()
                                        }
                                        // add the shim
                                        attachment.lastChild.appendChild(attachmentShim)
                                        // break the loop
                                        break
                                    }
                                }
                            }

                            attachmentShim.addEventListener("click", async () => {
                                // set attachment message Please wait while we retrieve the results...
                                setAttachmentShim(url, "javascript:void(0)", "Please wait while we retrieve the results...")
                                await run(url, sha256, id)
                            })

                            async function run(url, sha256, id) {

                                let options = {}
                                options.url = `https://www.hybrid-analysis.com/api/v2/report/${id[0]}/summary`
                                options.headers = {
                                    "accept": "application/json",
                                    "content-type": "application/json",
                                    "api-key": settings.apiKey,
                                    "user-agent": "Falcon Sandbox",
                                }
                                await request.get(options, function (error, response, body) {
                                    const json = JSON.parse(body)
                                    if (response.statusCode === 200 || response.statusCode === 201) {

                                        // creates a table of the file's indicators
                                        function showIndicators() {
                                            let indicatorTable = {malious: [], suspicious: [], informative: []}
                                            for (let i = 0; i < json.signatures.length; i++) {
                                                if (json.signatures[i].threat_level_human === "malicious") {
                                                    indicatorTable.malious.push(json.signatures[i]);
                                                } else if (json.signatures[i].threat_level_human === "suspicious") {
                                                    indicatorTable.suspicious.push(json.signatures[i]);
                                                } else if (json.signatures[i].threat_level_human === "informative") {
                                                    indicatorTable.informative.push(json.signatures[i]);
                                                }
                                            }

                                            function addIndicators(indicatorTable) {
                                                let indicatorTableKeys = []
                                                // renders the indicators of the file
                                                if (indicatorTable.informative.length > 0) {
                                                    let informativeSingatures = []
                                                    let listHeader = React.createElement("h3", {
                                                        class: "header-indicator header-indicator-informative"
                                                    }, "Informative");

                                                    var groupBy = function (xs, key) {
                                                        return xs.reduce(function (rv, x) {
                                                            (rv[x[key]] = rv[x[key]] || []).push(x);
                                                            return rv;
                                                        }, {});
                                                    }

                                                    let groupedInformative = groupBy(indicatorTable.informative.sort((a, b) => (a.relevance > b.relevance) ? 1 : -1), "category");
                                                    for (const key in groupedInformative) {
                                                        const categoryHeader = React.createElement("li", {
                                                            class: "category-header"
                                                        }, React.createElement("span", {
                                                            class: "category-header-text"
                                                        }, key));

                                                        let indicators = []
                                                        // React.createElement("span", {style: {float: 'right'}}, `${groupedInformative[key][i].threat_level}/10`)
                                                        for (let i = 0; i < groupedInformative[key].length; i++) {
                                                            let indicator = React.createElement("li", {
                                                                title: groupedInformative[key][i].description,
                                                                class: "indicator"
                                                            }, groupedInformative[key][i].name);
                                                            indicators.push(indicator);
                                                        }
                                                        const ul = React.createElement("ul", null, indicators);
                                                        // put category header inside ul
                                                        const li = React.createElement("li", {
                                                            class: "category-section category-section-informative"
                                                        }, categoryHeader, ul);
                                                        informativeSingatures.push(li);

                                                    }

                                                    indicatorTableKeys.push(React.createElement("div", null,
                                                        React.createElement("ul", {
                                                            class: "indicator-list"
                                                        }, listHeader, informativeSingatures)));

                                                }
                                                if (indicatorTable.suspicious.length > 0) {
                                                    let informativeSingatures = []
                                                    let listHeader = React.createElement("h3", {
                                                        class: "header-indicator header-indicator-suspicious"
                                                    }, "Suspicious");

                                                    // group by relevance
                                                    var groupBy = function (xs, key) {
                                                        return xs.reduce(function (rv, x) {
                                                            (rv[x[key]] = rv[x[key]] || []).push(x);
                                                            return rv;
                                                        }, {});
                                                    }

                                                    let groupedInformative = groupBy(indicatorTable.suspicious.sort((a, b) => (a.relevance > b.relevance) ? 1 : -1), "category");
                                                    for (const key in groupedInformative) {

                                                        const categoryHeader = React.createElement("li", {
                                                            class: "category-header"
                                                        }, React.createElement("span", {
                                                            class: "category-header-text"
                                                        }, key));

                                                        let indicators = []
                                                        for (let i = 0; i < groupedInformative[key].length; i++) {
                                                            let indicator = React.createElement("li", {
                                                                title: groupedInformative[key][i].description,
                                                                class: "indicator"
                                                            }, groupedInformative[key][i].name);
                                                            indicators.push(indicator);
                                                        }

                                                        const ul = React.createElement("ul", null, indicators);
                                                        // put category header inside ul
                                                        const li = React.createElement("li", {
                                                            class: "category-section category-section-suspicious",
                                                        }, categoryHeader, ul);
                                                        informativeSingatures.push(li);

                                                    }
                                                    indicatorTableKeys.push(React.createElement("div", null,
                                                        React.createElement("ul", {
                                                            class: "indicator-list"
                                                        }, listHeader, informativeSingatures)));
                                                }

                                                if (indicatorTable.malious.length > 0) {
                                                    let informativeSingatures = []
                                                    let listHeader = React.createElement("h3", {
                                                        class: "header-indicator header-indicator-malicious"
                                                    }, "Malicious");

                                                    var groupBy = function (xs, key) {
                                                        return xs.reduce(function (rv, x) {
                                                            (rv[x[key]] = rv[x[key]] || []).push(x);
                                                            return rv;
                                                        }, {});
                                                    }

                                                    let groupedInformative = groupBy(indicatorTable.malious.sort((a, b) => (a.relevance > b.relevance) ? 1 : -1), "category");
                                                    for (const key in groupedInformative) {

                                                        const categoryHeader = React.createElement("li", {
                                                            class: "category-header"
                                                        }, React.createElement("span", {
                                                            class: "category-header-text"
                                                        }, key));

                                                        let indicators = []
                                                        for (let i = 0; i < groupedInformative[key].length; i++) {
                                                            let indicator = React.createElement("li", {
                                                                title: groupedInformative[key][i].description,
                                                                class: "indicator",
                                                            }, groupedInformative[key][i].name);
                                                            indicators.push(indicator);
                                                        }

                                                        const ul = React.createElement("ul", null, indicators);
                                                        // put category header inside ul
                                                        const li = React.createElement("li", {
                                                            class: "category-section category-section-malicious",
                                                        }, categoryHeader, ul);
                                                        informativeSingatures.push(li);

                                                    }
                                                    indicatorTableKeys.push(React.createElement("div", null,
                                                        React.createElement("ul", {
                                                            class: "indicator-list"
                                                        }, listHeader, informativeSingatures)));
                                                }
                                                if (indicatorTable.informative.length === 0 && indicatorTable.suspicious.length === 0 && indicatorTable.malious.length === 0) {
                                                    indicatorTableKeys.push(React.createElement("p", {
                                                        class: "no-indicators"
                                                    }, "No Indicators Found"))
                                                    return indicatorTableKeys
                                                }
                                                return indicatorTableKeys;
                                            }

                                            return addIndicators(indicatorTable);
                                        }

                                        function showFileDetails() {
                                            let extractedFiles = [];
                                            let extractedFilesKeys = [];

                                            // shows the type of file
                                            if (json.extracted_files.length > 0) {
                                                for (let i = 0; i < json.extracted_files.length; i++) {
                                                    const typeTagsArray = json.extracted_files[i].type_tags?.map((typeTag) => {
                                                        return React.createElement("span", {
                                                            class: "type-tag"
                                                        }, typeTag);
                                                    })

                                                    // calculate the size of the file
                                                    function calcFileSize(fileSize) {
                                                        if (fileSize > 1000000000) {
                                                            return (fileSize / 1000000000).toFixed(2) + " GB";
                                                        } else if (fileSize > 1000000) {
                                                            return (fileSize / 1000000).toFixed(2) + " MB";
                                                        } else if (fileSize > 1000) {
                                                            return (fileSize / 1000).toFixed(2) + " KB";
                                                        } else {
                                                            return fileSize + " B";
                                                        }
                                                    }

                                                    const avLabel = json.extracted_files[i].av_total ? React.createElement("p", {class: "noMargin"}, "AV Scan Result: ", json.extracted_files[i].av_label, " (", json.extracted_files[i].av_matched, "/", json.extracted_files[i].av_total, ")") : null
                                                    const fileDetails = React.createElement("div", null, React.createElement("span", {
                                                        class: "noMargin file-name", title: json.extracted_files[i].description
                                                    }, `${json.extracted_files[i].name}`, React.createElement("span", {
                                                        class: "file-type", title: ""
                                                    }, typeTagsArray, React.createElement("span", {
                                                        class: "threat-level"
                                                    }, json.extracted_files[i].threat_level_readable))))
                                                    const fileDetailsList = React.createElement("div", {class: "noMargin"}, React.createElement("p", {class: "noMargin"}, "File Size: ", calcFileSize(json.extracted_files[i].file_size)), avLabel, React.createElement("p", {style: {margin: "0px"}}, "Runtime Process: ", json.extracted_files[i].runtime_process), React.createElement("p", {
                                                        class: "noMargin break-word"
                                                    }, "File MD5: ", json.extracted_files[i].md5), React.createElement("p", {
                                                        class: "noMargin break-word"
                                                    }, "File SHA1: ", json.extracted_files[i].sha1), React.createElement("p", {
                                                        class: "noMargin break-word"
                                                    }, "File SHA256: ", json.extracted_files[i].sha256))

                                                    // depending on the threat level of the file, change the color of the background
                                                    if (json.extracted_files[i].threat_level === 0) {
                                                        let extractedFile = React.createElement("li", {
                                                            class: "extracted-file extracted-file-clean"
                                                        }, [fileDetails, fileDetailsList]);

                                                        extractedFiles.push(extractedFile);
                                                    }

                                                    if (json.extracted_files[i].threat_level === 1) {
                                                        let extractedFile = React.createElement("li", {
                                                            class: "extracted-file extracted-file-suspicious"
                                                        }, [fileDetails, fileDetailsList]);

                                                        extractedFiles.push(extractedFile);
                                                    }
                                                    if (json.extracted_files[i].threat_level === 2) {
                                                        let extractedFile = React.createElement("li", {
                                                            class: "extracted-file extracted-file-malicious"
                                                        }, [fileDetails, fileDetailsList]);

                                                        extractedFiles.push(extractedFile);
                                                    }
                                                }
                                                extractedFilesKeys.push(React.createElement("div", {className: "extracted-files"},
                                                    React.createElement("ul", {
                                                        class: "extracted-files-list"
                                                    }, extractedFiles)));
                                                return extractedFilesKeys;
                                            } else {
                                                return React.createElement("div", {className: "extracted-files"}, React.createElement("p", {
                                                    class: "no-indicators"
                                                }, "No extracted files found"));
                                            }
                                        }

                                        // renders the components
                                        const components = [
                                            React.createElement("p", {
                                                class: "file-descriptor"
                                            }, `This file is classified as ${json.vx_family || "none"}, has a threat score of ${json.threat_score || 0}/100 (AV: ${json.av_detect}%) and is ${json.verdict}`),
                                            React.createElement("div", {className: "sample-singatures"},
                                                React.createElement("h2", {
                                                    class: "sample-header",
                                                }, "Indicators"),
                                                showIndicators()),
                                            React.createElement("div", {className: "sample-fileDeatils"}, React.createElement("h2", {
                                                class: "sample-header",
                                            }, "Extracted Files"), showFileDetails())
                                        ]

                                        // shows a model with the sample details
                                        Modals.showModal(`Full Scan Report - ${json.submit_name}`, components, {
                                            confirmText: "View On Hybrid Analysis",
                                            onConfirm: () => {
                                                window.open(`https://www.hybrid-analysis.com/sample/${json.sha256}/${json.job_id}`);
                                            },
                                            cancelText: "Close",
                                            onCancel: async () => {
                                                if (id.length > 1) {
                                                    id.shift()
                                                    await run(url, sha256, id)
                                                }
                                            }
                                        })
                                    } else {
                                        scanFailed(json.message)
                                    }

                                })
                            }
                        }

                        async function checkCompletion(sha256, id) {
                            // checks if the scan is complete
                            let options = {}
                            options.url = `https://www.hybrid-analysis.com/api/v2/report/${id}/state`
                            options.headers = {
                                "accept": "application/json",
                                "content-type": "application/json",
                                "api-key": settings.apiKey,
                                "user-agent": "Falcon Sandbox",

                            }
                            await request.get(options, async function (error, response, body) {
                                const json = JSON.parse(body)
                                console.log(json)
                                if (response.statusCode === 201 || response.statusCode === 200) {
                                    if (json.error) {
                                        scanFailed(json.error)
                                    } else {
                                        if (json.state === "IN_QUEUE") {
                                            setAttachmentShim(url, `https://www.hybrid-analysis.com/sample/${sha256}`, "In Queue... This may take some time.")
                                            setTimeout(() => {
                                                checkCompletion(sha256, id)
                                            }, 30000)
                                        } else if (json.state === "IN_PROGRESS") {
                                            let filesInProgress = 0
                                            // tells the user how many files are in progress
                                            for (let i = 0; i < json.related_reports.length; i++) {
                                                if (json.related_reports[i].state === "IN_PROGRESS") {
                                                    filesInProgress++
                                                }
                                            }
                                            setAttachmentShim(url, `https://www.hybrid-analysis.com/sample/${sha256}`, `In Progress (${filesInProgress}/${json.related_reports.length})... This may take some time.`)
                                            setTimeout(() => {
                                                checkCompletion(sha256, id)
                                            }, 30000)
                                        } else if (json.state === "SUCCESS") {
                                            const relatedReports = json.related_reports
                                            let relatedReportsIds = []
                                            for (let i = 0; i < relatedReports.length; i++) {
                                                relatedReportsIds.push(relatedReports[i].report_id)
                                            }
                                            await finished(sha256, relatedReportsIds.length > 0 ? relatedReportsIds : [id])
                                        }

                                    }
                                } else {
                                    scanFailed(json.message)
                                }
                            })
                        }


                        Modals.showModal("Select an OS environment to scan in", components, {
                            onConfirm: () => {
                                setAttachmentShim(url, "javascript:void(0)", "Preparing scan...")
                                let options = {}
                                options.url = "https://www.hybrid-analysis.com/api/v2/submit/url"
                                options.headers = {
                                    "accept": "application/json",
                                    "content-type": "application/json",
                                    "api-key": this.settings.apiKey,
                                    "user-agent": "Falcon Sandbox",

                                }
                                options.formData = {"url": url, "environment_id": dropdownOption, "no_share_third_party": this.settings.thirdPartiesShare.toString(), "allow_community_access": this.settings.communityAccess.toString(), "comment": "This is a request by BetterDiscord for the plugin VirusScanner", "experimental_anti_evasion": "true", "input_sample_tampering": "true", }
                                options.method = "POST"
                                // starts the scan
                                request(options, function (error, response, body) {
                                    const json = JSON.parse(body)
                                    console.log(json)
                                    if (response.statusCode === 201 || response.statusCode === 200) {
                                        Toasts.success("Scan started successfully")
                                        checkCompletion(json.sha256, json.job_id)
                                        // get response body
                                    } else {
                                        if (json.message) {
                                            scanFailed(json.message)
                                        }
                                    }
                                })
                            },
                            onCancel: () => {
                                Toasts.info("Scan cancelled")
                                removeAttachmentShim(url)
                                scanning.splice(scanning.indexOf(url), 1)
                            }
                        })
                    }
                }

                return class VirusScanner extends Plugin {
                    onStart() {
                        BdApi.injectCSS(config.info.name, `
                            .attachment-shim {
                                text-decoration: underline;
                                font-size: small;
                            }
                            .attachment-shim:hover {
                                cursor: pointer;
                            }
                            .attachment-shim-link {
                                color: #7289da;
                            }
                            
                            
                            .noMargin {
                                margin: 0;
                            }
                            .break-word {
                                word-break: break-word;
                            }
                            .header-indicator {
                                color: white;
                                margin: 0;
                                padding: 10px;
                                border-top-right-radius: 5px;
                                border-top-left-radius: 5px;
                                font-size: 20px;
                                font-weight: bold;
                             }
                             .header-indicator-informative {
                                background-color: #7289da;
                            }
                            .header-indicator-suspicious {
                                background-color: #f04747;
                            }
                            .header-indicator-malicious {
                                background-color: #ff0000;
                            }
                            .category-header {
                                margin: 0;
                                margin-top: 8px;
                                margin-bottom: 18px;
                            }
                            .category-header-text {
                                font-size: 16px;
                                font-weight: bold;
                                padding: 10px;
                                padding-left: 0;
                                margin: 0;
                            }
                            .indicator {
                                padding-left: 8px;
                                margin-bottom:4px;
                            }
                            
                            .indicator:hover {
                                cursor: pointer;
                                text-decoration: underline;
                            }
                            
                            .category-section {
                                padding: 10px;
                                font-size: 14px;
                                color: white;                              
                            }
                            .category-section-suspicious {
                                background-color: rgba(240, 71, 71, 0.78);
                                border-bottom: 1px solid #f04747;
                            }
                            
                            .category-section-malicious {
                                background-color: rgba(255, 0, 0, 0.78);
                                border-bottom: 1px solid #ff0000;
                            }
                            
                            .category-section-informative {
                                background-color: rgba(114, 137, 218, 0.78);
                                border-bottom: 1px solid #7289da;
                            }
                            
                            .indicator-list {
                                margin-top: 10px;
                            }
                            
                            .no-indicators {
                                margin-left: 0;
                                margin: 10px;
                                padding: 10px;
                                background-color: rgb(230 30 30 / 78%);
                            }
                            
                            
                            
                            .type-tag {
                                background-color: #007bff;
                                color: white;
                                padding: 2px;
                                border-radius: 5px;
                                margin-right: 5px;
                                font-size: 12px; 
                            }
           
                            .file-name {
                                font-weight: bold;
                            }
                            .file-name:hover {
                                cursor: pointer;
                            }
                            .file-type {
                                float: right;
                                font-size: 12px;
                                  
                            }
                            .threat-level {
                                display: block;
                                position: relative;
                                top: 5px;
                                font-size: 12px;
                            }
                            .extracted-file-list {
                                margin-top: 10px;
                            }
                            .extracted-file {
                                margin-bottom: 10px;
                                padding: 10px;
                                color: white;
                            }
                            .extracted-file-clean {
                                background-color: rgba(67, 181, 129, 0.78);
                            }
                            .extracted-file-suspicious {
                                background-color: rgba(240, 71, 71, 0.78);
                            }
                            .extracted-file-malicious {
                                background-color: rgba(255, 0, 0, 0.78);
                            }
                            .sample-header {
                                 font-size: 1.5rem;
                                 font-weight: bold;
                                 margin: 0;
                                 margin-bottom: 0.5rem;
                                 margin-top: 1rem;
                                 color: white;
                            }
                            
                            .file-descriptor {
                                font-size: inherit;
                                font-weight: bold;
                                margin: 0;
                                margin-bottom: 0.5rem;
                                margin-top: 1rem;
                                color: white;
                            }
                        `)

                        ContextMenu.getDiscordMenu("MessageContextMenu").then(menu => {
                            Patcher.after(
                                menu,
                                "default",
                                (_, [props], ret) => {
                                    let url = ""
                                    let label = "Scan File"
                                    if (props.attachment?.url) {
                                        url = props.attachment.url
                                    } else if (props.target.origin) {
                                        url = props.target.href
                                        label = "Scan URL"
                                    } else {
                                        return
                                    }
                                    const component = React.createElement("svg", {
                                        class: "downloadButton-2HLFWN",
                                        width: "24",
                                        height: "24",
                                        viewBox: "-80 -80 640 640",
                                    }, uploaderIcon)
                                    ret.props.children.splice(6, 0, ContextMenu.buildMenuItem({label: label, action: () => {
                                            if (scanning.includes(url)) {
                                                Toasts.error("This file is already being scanned or was scanned already.")
                                            } else {
                                                scanning.push(url) // Prevents the same file from being scanned twice while the scan is in progress
                                                setAttachmentShim(url, "javascript:void(0)", "Preparing scan...")
                                                if (!this.settings?.fullReport) {
                                                    new QuickScan(url, this.settings)
                                                } else {
                                                    new FullScan(url, this.settings)
                                                }

                                            }
                                        }
                                    }))
                                }
                            )
                        })
                        Patcher.after(
                            attachment,
                            "default",
                            (_, [props], ret) => {
                                let button = React.createElement("svg", {
                                    class: "downloadButton-2HLFWN",
                                    width: "24",
                                    height: "24",
                                    viewBox: "-80 -80 640 640",

                                    onClick: () => {
                                        if (scanning.includes(ret.props.children[0].props.children[3].props.href)) {
                                            Toasts.error("This file is already being scanned or was scanned already.")
                                        } else {
                                            scanning.push(ret.props.children[0].props.children[3].props.href) // Prevents the same file from being scanned twice while the scan is in progress
                                            setAttachmentShim(ret.props.children[0].props.children[3].props.href, "javascript:void(0)", "Preparing scan...")
                                            if (!this.settings?.fullReport) {
                                                setAttachmentShim(ret.props.children[0].props.children[3].props.href, "javascript:void(0)", "Preparing scan...")
                                                new QuickScan(ret.props.children[0].props.children[3].props.href, this.settings)
                                            } else {
                                                new FullScan(ret.props.children[0].props.children[3].props.href, this.settings)
                                            }
                                        }
                                    }
                                }, uploaderIcon);

                                ret.props.children[0].props.children.splice(2, 0, button)
                            }
                        )
                    }

                    getSettingsPanel() {
                        return this.buildSettingsPanel().getElement();
                    }

                    onStop() {
                        Patcher.unpatchAll(config.info.name);
                        BdApi.clearCSS(config.info.name);
                    }
                };
            };
            return plugin(Plugin, Library);
        })(global.ZeresPluginLibrary.buildPlugin(config));
})();
