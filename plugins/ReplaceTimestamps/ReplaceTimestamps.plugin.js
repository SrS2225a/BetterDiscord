/**
 * @name ReplaceTimestamps
 * @author Nyx
 * @authorId 270848136006729728
 * @version 1.0.0
 * @license MIT
 * @description Replaces plaintext timestamps with Discord's timestamps for accurate time no matter the timezone.
 * @website https://github.com/SrS2225a
 * @source https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/Custom%20Uploader.plugin.js
 * @updateUrl https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/Custom%20Uploader.plugin.js
 */


const request = require("request");
module.exports = (() => {
    const config = {
        info: {
            name: "ReplaceTimestamps",
            authors: [
                {
                    name: "Nyx",
                    discord_id: "27048136006729728",
                }
            ],
            version: "1.2.1",
            description: "Replaces plaintext timestamps with Discord's timestamps for accurate time no matter the timezone."
        },
        github: "https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins",
        github_raw:"https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/Custom%20Uploader.plugin.js",
        main: "index.js",
        defaultConfig: [
            {
                type: "dropdown",
                name: "Timestamp Format",
                note: "The prefix to use to format the timestamp.",
                value: "t",
                id: "prefix",
                options: [
                    {
                        label: "Short Time: 16:30",
                        value: "t"
                    }, {
                        label: "Long Time: 16:30:00",
                        value: "T"
                    }, {
                        label: "Short Date: 16/10/2018",
                        value: "d"
                    }, {
                        label: "Long Date: 16 October 2018",
                        value: "D"
                    }, {
                        label: "Short Date/Time: 16 October 2018 16:30",
                        value: "f"
                    }, {
                        label: "Long Date/Time: Tuesday, 16 October 2018 16:30:00",
                        value: "F"
                    }, {
                        label: "Realative Time: 2 hours ago",
                        value: "R"
                    }
                ]
            }, {
                type: "textbox",
                name: "Character Ussage",
                note: "Regex for what characters you should wrap your text in to replace the timestamp.",
                value: "\\!!(.*?)\\!!",
                id: "config",
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
                const { Patcher, WebpackModules, ContextMenu, DiscordModules, Toasts } = Library;
                const {Dispatcher, React} = DiscordModules;

                function ConvertDate(time) {
                    console.log(time);
                    if (time == null) {
                        return "Invalid time format";
                    } else {
                        // can we use javascript's built in date parser? If so, just use that.
                        let date = Date.parse(time) / 1000
                        if (isNaN(date)) {
                            // converts a duration as unix time. Example: "1d2h3m4s" -> 86400 + 3600 + 180 + 4 = 92484
                            const times = time.match(/\d+\s*\w+/g);
                            let years = 0;
                            let months = 0;
                            let weeks = 0;
                            let days = 0;
                            let hours = 0;
                            let minutes = 0;
                            let seconds = 0;
                            if (times) {
                                times.forEach(time => {
                                    const value = time.match(/\d+/g)[0];
                                    const label = time.match(/(?<=\s|\d)(mo|[ywdhms])/gi);
                                    if (label !== null) {
                                        switch (label[0]) {
                                            case 'y':
                                                years = value * 365 * 24 * 60 * 60;
                                                break;

                                            case 'mo':
                                                months = value * 30 * 24 * 60 * 60;
                                                break;

                                            case 'w':
                                                weeks = value * 7 * 24 * 60 * 60;
                                                break;

                                            case 'd':
                                                days = value * 24 * 60 * 60;
                                                break;

                                            case 'h':
                                                hours = value * 60 * 60;
                                                break;

                                            case 'm':
                                                minutes = value * 60;
                                                break;

                                            case 's':
                                                seconds = value;
                                                break;
                                        }
                                    }
                                });
                                const result = years + months + weeks + days + hours + minutes + seconds
                                // converts time as unix time. Example: 10:00 = 36000. Or 9:00 AM = 32400
                                if (result === 0) {
                                    const matchTime = time.match(/\b(24:00|2[0-3]:\d\d|[01]?\d((:\d\d)( ?(a|p)m?)?| ?(a|p)m?))\b/ig)
                                    if (matchTime) {
                                        const time = matchTime[0].split(':')
                                        let hours = parseInt(time[0])
                                        const minutes = parseInt(time[1])
                                        const ampm = time[1]?.match(/[a|p]m?/i)
                                        if (ampm) {
                                            if (ampm[0].toLowerCase() === 'a' || ampm[0].toLowerCase() === 'am') {
                                                if (hours === 12) {
                                                    hours = 0
                                                }
                                            } else {
                                                if (hours !== 12) {
                                                    hours += 12
                                                }
                                            }
                                        }
                                        var dt = new Date();
                                        dt.setHours(hours);
                                        dt.setMinutes(minutes);
                                        dt.setSeconds(0);
                                        dt.setMilliseconds(0);
                                        return `<t:${Math.round(dt.getTime() / 1000)}:${this.settings.prefix}>`
                                    }
                                } else {return `<t:${Math.round(new Date(Date.now() + result * 1000).getTime() / 1000)}:${this.settings.prefix}>`}
                            } else {
                                return "Invalid time format"
                            }
                        } else {
                            return `<t:${date}:${this.settings.prefix}>`
                        }
                    }
                }

                return class ReplaceTimestamps extends Plugin {
                    onStart() {
                        Patcher.before(DiscordModules.MessageActions, "sendMessage", (props, ret) => {
                            let content = ret[1].content;
                            let regex = new RegExp(this.settings.config, "g")
                            if (regex.test(content)) {
                                content = content.replace(regex, ConvertDate.bind(this));
                            }
                            ret[1].content = content;
                        })
                    }

                    getSettingsPanel() {
                        return this.buildSettingsPanel().getElement();
                    }

                    onStop() {
                        Patcher.unpatchAll(config.info.name);
                    }
                };
            };
            return plugin(Plugin, Library);
        })(global.ZeresPluginLibrary.buildPlugin(config));
})();
