/**
 * @name AtSomeone
 * @author Nyx
 * @authorId 270848136006729728
 * @version 1.0.0
 * @license MIT
 * @description A plugin that allows you to @someone (randomly) in a message.
 * @website https://github.com/SrS2225a
 * @source https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/ReplaceTimestamps/ReplaceTimestamps.plugin.js
 * @updateUrl https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/ReplaceTimestamps/ReplaceTimestamps.plugin.js
 */


const request = require("request");
module.exports = (() => {
    const config = {
        info: {
            name: "AtSomeone",
            authors: [
                {
                    name: "Nyx",
                    discord_id: "27048136006729728",
                }
            ],
            version: "1.0.1",
            description: "A plugin that allows you to @someone (randomly) in a message.",
        },
        changelog: [
            {
                title: "Fixes",
                items: [`Got rid of the settings button`]
            }
        ],
        github: "https://github.com/SrS2225a/BetterDiscord/blob/master/plugins/ReplaceTimestamps/ReplaceTimestamps.plugin.js",
        github_raw:"https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/ReplaceTimestamps/ReplaceTimestamps.plugin.js",
        main: "index.js",
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
                const { Patcher, Modals, DiscordModules, WebpackModules} = Library;
                const MemberStore = WebpackModules.getByProps('getMembers', 'getMemberIds');

                return class ReplaceTimestamps extends Plugin {
                    onStart() {
                        Patcher.before(DiscordModules.MessageActions, "sendMessage", (t,a) => {
                            let content = a[1].content.split(" ");
                            const channel = DiscordModules.SelectedChannelStore.getChannelId()
                            // check if the author is in the guild or in a dm
                            if (DiscordModules.ChannelStore.getChannel(channel).type === 1) {
                                const dmChannel = DiscordModules.ChannelStore.getChannel(channel)
                                const dmUsers = dmChannel.recipients

                                for (let i = 0; i < content.length; i++) {
                                    if (content[i].startsWith("@someone")) {
                                        // choose between the recipient(s) or the author
                                        if (Math.random() * 2 > 1) {
                                            content[i] = `<@${DiscordModules.UserStore.getCurrentUser().id}>`
                                        } else {
                                            content[i] = `<@${dmUsers[Math.floor(Math.random() * dmUsers.length)]}>`
                                        }
                                    }
                                }
                            } else {
                                const guild = DiscordModules.SelectedGuildStore.getLastSelectedGuildId()
                                const members = DiscordModules.GuildMemberStore.getMembers(guild)
                                for (let i = 0; i < content.length; i++) {
                                    if (content[i].startsWith("@someone")) {
                                        content[i] = `<@${members[Math.floor(Math.random() * members.length)].userId}>`
                                    }
                                }
                            }
                            a[1].content = content.join(" ")
                        })
                    }

                    onStop() {
                        Patcher.unpatchAll();
                    }
                };
            };
            return plugin(Plugin, Library);
        })(global.ZeresPluginLibrary.buildPlugin(config));
})();

