let baseUrl = window.location.origin;
let scanned = false;
let updateAdminTimeout = null;
let updateUserTimeout = null;
let updateInterval = 5000;
let instanceToDelete = null;
let isAdminLogin = false;
let currentInstanceData = null;

document.addEventListener("DOMContentLoaded", function () {
  // Add error handling for the entire application
  try {
    const loginForm = document.getElementById("loginForm");
    const loginTokenInput = document.getElementById("loginToken");
    const regularLoginBtn = document.getElementById("regularLoginBtn");
    const adminLoginBtn = document.getElementById("loginAsAdminBtn");

    hideWidgets();

    $("#deleteInstanceModal").modal({
      closable: true,
      onDeny: function () {
        instanceToDelete = null;
      },
    });

    // Initialize all event dropdowns
    initializeEventDropdowns();

    // Initialize S3 media delivery dropdown
    $("#s3MediaDelivery").dropdown();
    $("#addInstanceS3MediaDelivery").dropdown();

    // Initialize other RabbitMQ dropdowns
    $("#addInstanceRabbitMQExchangeType").dropdown();
    $("#addInstanceRabbitMQQueueType").dropdown();
    $("#addInstanceRabbitMQDeliveryMode").dropdown();
    $("#rabbitmqExchangeType").dropdown();
    $("#rabbitmqQueueType").dropdown();
    $("#rabbitmqDeliveryMode").dropdown();
    $("#addInstanceCallRejectType").dropdown();

    // Initialize WhatsApp config dropdowns
    $("#addInstanceWAPlatform").dropdown();
    $("#addInstanceWAReleaseChannel").dropdown();
    $("#addInstanceWAWebSubPlatform").dropdown();
    $("#addInstanceWAConnectType").dropdown();
    $("#addInstanceWAPlatformType").dropdown();

    // Initialize proxy enabled checkbox with onChange handler
    $("#proxyEnabledToggle").checkbox({
      onChange: function () {
        const enabled = $("#proxyEnabled").is(":checked");
        if (enabled) {
          $("#proxyUrlField").addClass("show");
        } else {
          $("#proxyUrlField").removeClass("show");
        }
      },
    });

    // Initialize add instance proxy toggle
    $("#addInstanceProxyToggle").checkbox({
      onChange: function () {
        const enabled = $('input[name="proxy_enabled"]').is(":checked");
        if (enabled) {
          $("#addInstanceProxyUrlField").show();
        } else {
          $("#addInstanceProxyUrlField").hide();
          $('input[name="proxy_url"]').val("");
        }
      },
    });

    // Initialize add instance skip media, groups, newsletters, broadcasts, own messages toggles
    $("#addInstanceSkipMediaToggle").checkbox();
    $("#addInstanceSkipGroupsToggle").checkbox();
    $("#addInstanceSkipNewslettersToggle").checkbox();
    $("#addInstanceSkipBroadcastsToggle").checkbox();
    $("#addInstanceSkipOwnMessagesToggle").checkbox();
    $("#addInstanceEchoApiToggle").checkbox();

    // Initialize add instance S3 toggle
    $("#addInstanceS3Toggle").checkbox({
      onChange: function () {
        const enabled = $('input[name="s3_enabled"]').is(":checked");
        if (enabled) {
          $("#addInstanceS3Fields").show();
        } else {
          $("#addInstanceS3Fields").hide();
          // Clear S3 fields when disabled
          $('input[name="s3_endpoint"]').val("");
          $('input[name="s3_access_key"]').val("");
          $('input[name="s3_secret_key"]').val("");
          $('input[name="s3_bucket"]').val("");
          $('input[name="s3_region"]').val("");
          $('input[name="s3_public_url"]').val("");
          $('input[name="s3_retention_days"]').val("30");
          $('input[name="s3_path_style"]').prop("checked", false);
          $('input[name="s3_disable_acl"]').prop("checked", false);
          $("#addInstanceS3MediaDelivery").dropdown("set selected", "base64");
        }
      },
    });

    // Initialize add instance RabbitMQ toggle
    $("#addInstanceRabbitMQToggle").checkbox({
      onChange: function () {
        const enabled = $('input[name="rabbitmq_enabled"]').is(":checked");
        if (enabled) {
          $("#addInstanceRabbitMQFields").show();
        } else {
          $("#addInstanceRabbitMQFields").hide();
          // Clear RabbitMQ fields when disabled
          $('input[name="rabbitmq_url"]').val("");
          $('input[name="rabbitmq_exchange"]').val("");
          $('input[name="rabbitmq_routing_key"]').val("");
          $('input[name="rabbitmq_queue"]').val("");
          $('input[name="rabbitmq_durable"]').prop("checked", true);
          $('input[name="rabbitmq_auto_delete"]').prop("checked", false);
          $('input[name="rabbitmq_exclusive"]').prop("checked", false);
          $('input[name="rabbitmq_no_wait"]').prop("checked", false);
          $("#addInstanceRabbitMQExchangeType").dropdown(
            "set selected",
            "topic",
          );
          $("#addInstanceRabbitMQQueueType").dropdown(
            "set selected",
            "classic",
          );
          $("#addInstanceRabbitMQDeliveryMode").dropdown("set selected", "2");
          $("#addInstanceRabbitMQEvents").dropdown("clear");
        }
      },
    });

    // Initialize add instance skip calls toggle
    $("#addInstanceSkipCallsToggle").checkbox({
      onChange: function () {
        const enabled = $('input[name="skip_calls"]').is(":checked");
        if (enabled) {
          $("#addInstanceCallRejectFields").show();
          $("#addInstanceCallMessageField").show();
        } else {
          $("#addInstanceCallRejectFields").hide();
          $("#addInstanceCallMessageField").hide();
          $("#addInstanceCallRejectType").dropdown("set selected", "busy");
          $('input[name="call_reject_message"]').val(
            "Sorry, I cannot take calls at the moment.",
          );
        }
      },
    });

    // Initialize add instance WhatsApp toggle
    $("#addInstanceWhatsAppToggle").checkbox({
      onChange: function () {
        const enabled = $('input[name="whatsapp_enabled"]').is(":checked");
        if (enabled) {
          $("#addInstanceWhatsAppFields").show();
        } else {
          $("#addInstanceWhatsAppFields").hide();
          // Clear WhatsApp fields when disabled
          $('input[name="wa_version"]').val("");
          $('input[name="wa_os_name"]').val("");
          $('input[name="wa_os_version"]').val("");
          $('input[name="wa_device_name"]').val("");
          $('input[name="wa_manufacturer"]').val("");
          $('input[name="wa_device_board"]').val("");
          $('input[name="wa_locale_language"]').val("");
          $('input[name="wa_locale_country"]').val("");
          $('input[name="wa_mcc"]').val("");
          $('input[name="wa_mnc"]').val("");
          $("#addInstanceWAPlatform").dropdown("clear");
          $("#addInstanceWAReleaseChannel").dropdown("clear");
          $("#addInstanceWAWebSubPlatform").dropdown("clear");
          $("#addInstanceWAConnectType").dropdown("clear");
          $("#addInstanceWAPlatformType").dropdown("clear");
        }
      },
    });

    // Handle admin login button click
    adminLoginBtn.addEventListener("click", function () {
      isAdminLogin = true;
      loginForm.classList.add("loading");

      // Change button appearance to show admin mode
      adminLoginBtn.classList.add("teal");
      adminLoginBtn.innerHTML =
        '<i class="shield alternate icon"></i> Admin Mode';
      $("#loginToken").val("").focus();

      // Show admin-specific instructions
      $(".ui.info.message").html(`
        <div class="header mb-4">
            <i class="user shield icon"></i>
            Admin Login
        </div>
        <p>Please enter your admin credentials:</p>
        <ul>
            <li>Use your admin token in the field above</li>
        </ul>
    `);

      // Focus on token input
      loginTokenInput.focus();
      loginForm.classList.remove("loading");
    });

    // Handle form submission
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const token = loginTokenInput.value.trim();

      if (!token) {
        showError("Please enter your access token");
        $("#loginToken").focus();
        return;
      }

      loginForm.classList.add("loading");

      setTimeout(() => {
        if (isAdminLogin) {
          handleAdminLogin(token, true);
        } else {
          handleRegularLogin(token, true);
        }

        loginForm.classList.remove("loading");
      }, 1000);
    });

    $("#menulogout").on("click", function (e) {
      $(".adminlogin").hide();
      e.preventDefault();
      removeLocalStorageItem("isAdmin");
      removeLocalStorageItem("admintoken");
      removeLocalStorageItem("token");
      removeLocalStorageItem("currentInstance");
      currentInstanceData = null; // Clear instance data
      window.location.reload();
      return false;
    });

    document
      .getElementById("pairphoneinput")
      .addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
          const phone = document.getElementById("pairphoneinput").value.trim();
          if (phone) {
            // Get the pairing token from localStorage or current session
            const pairingToken =
              getLocalStorageItem("currentPairingToken") ||
              getLocalStorageItem("token");
            const instanceId = getLocalStorageItem("currentPairingInstance");

            // First establish connection
            document.getElementById("pairInfo").innerHTML = "Connecting...";
            connect(pairingToken)
              .then((data) => {
                if (data.success == true) {
                  document.getElementById("pairInfo").innerHTML =
                    "Getting pairing code...";

                  // Wait for connection to establish properly before requesting pair code
                  setTimeout(() => {
                    pairPhoneWithToken(phone, pairingToken)
                      .then((data) => {
                        document
                          .getElementById("pairHelp")
                          .classList.add("hidden");
                        // Success case
                        if (
                          data.success &&
                          data.data &&
                          data.data.LinkingCode
                        ) {
                          document.getElementById("pairInfo").innerHTML =
                            `Your link code is: ${data.data.LinkingCode}`;
                          // Start checking status for pairing completion
                          window.currentPairInterval = setInterval(() => {
                            checkInstanceStatus(pairingToken)
                              .then((statusData) => {
                                if (
                                  statusData.data &&
                                  statusData.data.loggedIn
                                ) {
                                  clearInterval(window.currentPairInterval);
                                  window.currentPairInterval = null;
                                  document.getElementById(
                                    "pairInfo",
                                  ).innerHTML =
                                    "Pairing successful! Device linked.";
                                  // Close modal after successful pairing
                                  setTimeout(() => {
                                    $("#modalLoginWithCode").modal("hide");
                                    if (instanceId) {
                                      updateAdmin();
                                    } else {
                                      updateUser();
                                    }
                                    // Clean up pairing data
                                    removeLocalStorageItem(
                                      "currentPairingToken",
                                    );
                                    removeLocalStorageItem(
                                      "currentPairingInstance",
                                    );
                                  }, 2000);
                                }
                              })
                              .catch((error) => {
                                console.error(
                                  "Status check error during pairing:",
                                  error,
                                );
                              });
                          }, 2000);
                        } else {
                          const errorMsg = data.error || "Unknown error";
                          document.getElementById("pairInfo").innerHTML =
                            `Problem getting pairing code: ${errorMsg}`;
                        }
                      })
                      .catch((error) => {
                        // Error case
                        const errorMsg = error.message || "Unknown error";
                        document.getElementById("pairInfo").innerHTML =
                          `Problem getting pairing code: ${errorMsg}`;
                        console.error("Pairing error:", error);
                      });
                  }, 2000); // Wait 2 seconds for connection to establish
                } else {
                  const errorMsg = data.error || "Unknown error";
                  document.getElementById("pairInfo").innerHTML =
                    `Connection failed: ${errorMsg}`;
                }
              })
              .catch((error) => {
                const errorMsg = error.message || "Unknown error";
                document.getElementById("pairInfo").innerHTML =
                  `Connection error: ${errorMsg}`;
                console.error("Connection error:", error);
              });
          }
        }
      });

    document
      .getElementById("userinfoinput")
      .addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
          doUserInfo();
        }
      });

    document
      .getElementById("useravatarinput")
      .addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
          doUserAvatar();
        }
      });

    document.getElementById("userInfo").addEventListener("click", function () {
      document.getElementById("userInfoContainer").innerHTML = "";
      document.getElementById("userInfoContainer").classList.add("hidden");
      $("#modalUserInfo")
        .modal({
          onApprove: function () {
            doUserInfo();
            return false;
          },
        })
        .modal("show");
    });

    document
      .getElementById("userAvatar")
      .addEventListener("click", function () {
        document.getElementById("userAvatarContainer").innerHTML = "";
        document.getElementById("userAvatarContainer").classList.add("hidden");
        $("#modalUserAvatar")
          .modal({
            onApprove: function () {
              doUserAvatar();
              return false;
            },
          })
          .modal("show");
      });

    document
      .getElementById("sendTextMessage")
      .addEventListener("click", function () {
        document.getElementById("sendMessageContainer").innerHTML = "";
        document.getElementById("sendMessageContainer").classList.add("hidden");
        $("#modalSendTextMessage")
          .modal({
            onApprove: function () {
              sendTextMessage().then((result) => {
                document
                  .getElementById("sendMessageContainer")
                  .classList.remove("hidden");
                if (result.success === true) {
                  document.getElementById("sendMessageContainer").innerHTML =
                    `Message sent successfully. Id: ${result.data.Id}`;
                } else {
                  document.getElementById("sendMessageContainer").innerHTML =
                    `Problem sending message: ${result.error}`;
                }
              });
              return false;
            },
          })
          .modal("show");
      });

    document
      .getElementById("deleteMessage")
      .addEventListener("click", function () {
        document.getElementById("deleteMessageContainer").innerHTML = "";
        document
          .getElementById("deleteMessageContainer")
          .classList.add("hidden");
        $("#modalDeleteMessage")
          .modal({
            onApprove: function () {
              deleteMessage().then((result) => {
                document
                  .getElementById("deleteMessageContainer")
                  .classList.remove("hidden");
                if (result.success === true) {
                  document.getElementById("deleteMessageContainer").innerHTML =
                    `Message deleted successfully.`;
                } else {
                  document.getElementById("deleteMessageContainer").innerHTML =
                    `Problem deleting message: ${result.error}`;
                }
              });
              return false;
            },
          })
          .modal("show");
      });

    document
      .getElementById("userContacts")
      .addEventListener("click", function () {
        getContacts();
      });

    document
      .getElementById("businessProfile")
      .addEventListener("click", function () {
        document.getElementById("businessProfileResult").innerHTML = "";
        document
          .getElementById("businessProfileResult")
          .classList.add("hidden");
        $("#modalBusinessProfile")
          .modal({
            onApprove: function () {
              doBusinessProfile();
              return false;
            },
          })
          .modal("show");
      });

    document
      .getElementById("phonebusinessfield")
      .addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
          doBusinessProfile();
        }
      });

    // S3 Configuration
    document.getElementById("s3Config").addEventListener("click", function () {
      $("#modalS3Config")
        .modal({
          onApprove: function () {
            saveS3Config();
            return false;
          },
        })
        .modal("show");
      loadS3Config();
    });

    // Proxy Configuration
    document
      .getElementById("proxyConfig")
      .addEventListener("click", function () {
        $("#modalProxyConfig")
          .modal({
            onApprove: function () {
              saveProxyConfig();
              return false;
            },
          })
          .modal("show");
        loadProxyConfig();
      });

    // Webhook Configuration
    document
      .getElementById("webhookConfig")
      .addEventListener("click", function () {
        webhookModal();
      });

    // RabbitMQ Configuration
    document
      .getElementById("rabbitmqConfig")
      .addEventListener("click", function () {
        $("#modalRabbitMQConfig")
          .modal({
            onApprove: function () {
              saveRabbitMQConfig();
              return false;
            },
          })
          .modal("show");
        loadRabbitMQConfig();
      });

    // S3 Test Connection
    document
      .getElementById("testS3Connection")
      .addEventListener("click", function () {
        testS3Connection();
      });

    // S3 Delete Configuration
    document
      .getElementById("deleteS3Config")
      .addEventListener("click", function () {
        deleteS3Config();
      });

    // Webhook Delete Configuration
    document
      .getElementById("deleteWebhookConfig")
      .addEventListener("click", async function () {
        try {
          const res = await deleteWebhook();
          if (res && (res.success || res.code === 200)) {
            showSuccess("Webhook deleted successfully");
            $("#webhookinput").val("");
            $("#webhookEvents").dropdown("clear");
            $("#modalSetWebhook").modal("hide");
          } else {
            showError(
              "Failed to delete webhook: " +
                ((res && (res.error || res.details)) || "Unknown error"),
            );
          }
        } catch (e) {
          console.error(e);
          showError("Error deleting webhook");
        }
      });

    // RabbitMQ Test Connection
    document
      .getElementById("testRabbitMQConnection")
      .addEventListener("click", function () {
        testRabbitMQConnection();
      });

    // RabbitMQ Delete Configuration
    document
      .getElementById("deleteRabbitMQConfig")
      .addEventListener("click", function () {
        deleteRabbitMQConfig();
      });

    // Skip Media Configuration
    document
      .getElementById("skipMediaConfig")
      .addEventListener("click", function () {
        $("#modalSkipMediaConfig")
          .modal({
            onApprove: function () {
              saveSkipMediaConfig();
              return false;
            },
          })
          .modal("show");
        loadSkipMediaConfig();
      });

    // Skip Groups Configuration
    document
      .getElementById("skipGroupsConfig")
      .addEventListener("click", function () {
        loadSkipGroupsConfig();
        $("#modalSkipGroupsConfig").modal("show");
      });

    // Skip Newsletters Configuration
    document
      .getElementById("skipNewslettersConfig")
      .addEventListener("click", function () {
        loadSkipNewslettersConfig();
        $("#modalSkipNewslettersConfig").modal("show");
      });

    // Skip Broadcasts Configuration
    document
      .getElementById("skipBroadcastsConfig")
      .addEventListener("click", function () {
        loadSkipBroadcastsConfig();
        $("#modalSkipBroadcastsConfig").modal("show");
      });

    // Skip Own Messages Configuration
    document
      .getElementById("skipOwnMessagesConfig")
      .addEventListener("click", function () {
        loadSkipOwnMessagesConfig();
        $("#modalSkipOwnMessagesConfig").modal("show");
      });

    // Skip Calls Configuration
    document
      .getElementById("skipCallsConfig")
      .addEventListener("click", function () {
        loadSkipCallsConfig();
        $("#modalSkipCallsConfig").modal("show");
      });

    // Skip Media Download Toggle Handler
    $("#skipMediaDownloadToggle").checkbox({
      onChange: function () {
        const enabled = $("#skipMediaDownload").is(":checked");
        if (enabled) {
          $("#skipMediaWarning").show();
          $("#skipMediaBenefit").show();
        } else {
          $("#skipMediaWarning").hide();
          $("#skipMediaBenefit").hide();
        }
      },
    });

    // Skip Groups Toggle Handler
    $("#skipGroupsToggle").checkbox({
      onChange: function () {
        const enabled = $("#skipGroups").is(":checked");
        if (enabled) {
          $("#skipGroupsWarning").show();
          $("#skipGroupsBenefit").show();
        } else {
          $("#skipGroupsWarning").hide();
          $("#skipGroupsBenefit").hide();
        }
      },
    });

    // Skip Newsletters Toggle Handler
    $("#skipNewslettersToggle").checkbox({
      onChange: function () {
        const enabled = $("#skipNewsletters").is(":checked");
        if (enabled) {
          $("#skipNewslettersWarning").show();
          $("#skipNewslettersBenefit").show();
        } else {
          $("#skipNewslettersWarning").hide();
          $("#skipNewslettersBenefit").hide();
        }
      },
    });

    // Skip Broadcasts Toggle Handler
    $("#skipBroadcastsToggle").checkbox({
      onChange: function () {
        const enabled = $("#skipBroadcasts").is(":checked");
        if (enabled) {
          $("#skipBroadcastsWarning").show();
          $("#skipBroadcastsBenefit").show();
        } else {
          $("#skipBroadcastsWarning").hide();
          $("#skipBroadcastsBenefit").hide();
        }
      },
    });

    // Skip Own Messages Toggle Handler
    $("#skipOwnMessagesToggle").checkbox({
      onChange: function () {
        const enabled = $("#skipOwnMessages").is(":checked");
        if (enabled) {
          $("#skipOwnMessagesWarning").show();
          $("#skipOwnMessagesBenefit").show();
        } else {
          $("#skipOwnMessagesWarning").hide();
          $("#skipOwnMessagesBenefit").hide();
        }
      },
    });

    // Skip Calls Toggle Handler
    $("#skipCallsToggle").checkbox({
      onChange: function () {
        const enabled = $("#skipCalls").is(":checked");
        if (enabled) {
          $("#skipCallsWarning").show();
          $("#skipCallsBenefit").show();
          $("#callRejectConfigFields").show();
        } else {
          $("#skipCallsWarning").hide();
          $("#skipCallsBenefit").hide();
          $("#callRejectConfigFields").hide();
        }
      },
    });

    // Proxy checkbox toggle is now initialized in DOMContentLoaded

    $("#addInstanceButton").click(function () {
      $("#addInstanceModal")
        .modal({
          onApprove: function (e, pp) {
            $("#addInstanceForm").submit();
            return false;
          },
        })
        .modal("show");
    });

    $("#addInstanceForm").form({
      fields: {
        name: {
          identifier: "name",
          rules: [
            {
              type: "empty",
              prompt: "Please enter a name for the instance",
            },
          ],
        },
        token: {
          identifier: "token",
          rules: [
            {
              type: "empty",
              prompt: "Please enter an authentication token for the instance",
            },
          ],
        },
        events: {
          identifier: "events",
          optional: true,
          rules: [],
        },
        proxy_url: {
          identifier: "proxy_url",
          optional: true,
          rules: [
            {
              type: "regExp[^(https?|socks5)://.*]",
              prompt:
                "Proxy URL must start with http://, https://, or socks5://",
            },
          ],
        },
        s3_endpoint: {
          identifier: "s3_endpoint",
          optional: true,
          rules: [
            {
              type: "url",
              prompt: "Please enter a valid S3 endpoint URL",
            },
          ],
        },
        s3_bucket: {
          identifier: "s3_bucket",
          optional: true,
          rules: [
            {
              type: "regExp[^[a-z0-9][a-z0-9.-]*[a-z0-9]$]",
              prompt: "Please enter a valid S3 bucket name",
            },
          ],
        },
      },
      onSuccess: function (event, fields) {
        event.preventDefault();

        // Validate conditional fields
        const proxyEnabled =
          fields.proxy_enabled === "on" || fields.proxy_enabled === true;
        const s3Enabled =
          fields.s3_enabled === "on" || fields.s3_enabled === true;
        const rabbitmqEnabled =
          fields.rabbitmq_enabled === "on" || fields.rabbitmq_enabled === true;
        const hasWebhook =
          fields.webhook_url && fields.webhook_url.trim() !== "";
        const hasEvents = fields.events && fields.events.length > 0;
        const skipMedia =
          fields.skip_media === "on" || fields.skip_media === true;
        const skipGroups =
          fields.skip_groups === "on" || fields.skip_groups === true;
        const skipNewsletters =
          fields.skip_newsletters === "on" || fields.skip_newsletters === true;
        const skipBroadcasts =
          fields.skip_broadcasts === "on" || fields.skip_broadcasts === true;
        const skipOwnMessages =
          fields.skip_own_messages === "on" ||
          fields.skip_own_messages === true;
        const skipCalls =
          fields.skip_calls === "on" || fields.skip_calls === true;
        const callRejectMessage =
          fields.call_reject_message ||
          "Sorry, I cannot take calls at the moment.";
        const callRejectType = fields.call_reject_type || "busy";
        const whatsappEnabled =
          fields.whatsapp_enabled === "on" || fields.whatsapp_enabled === true;

        // Events are required only if webhook is provided or RabbitMQ is enabled
        if ((hasWebhook || rabbitmqEnabled) && !hasEvents) {
          showError(
            "Events are required when webhook URL or RabbitMQ is configured",
          );
          return false;
        }

        if (proxyEnabled && !fields.proxy_url) {
          showError("Proxy URL is required when proxy is enabled");
          return false;
        }

        if (s3Enabled) {
          if (!fields.s3_bucket) {
            showError("S3 bucket name is required when S3 is enabled");
            return false;
          }
          if (!fields.s3_access_key) {
            showError("S3 access key is required when S3 is enabled");
            return false;
          }
          if (!fields.s3_secret_key) {
            showError("S3 secret key is required when S3 is enabled");
            return false;
          }
        }

        if (rabbitmqEnabled) {
          if (!fields.rabbitmq_url) {
            showError("RabbitMQ URL is required when RabbitMQ is enabled");
            return false;
          }
          if (!fields.rabbitmq_exchange) {
            showError("RabbitMQ exchange is required when RabbitMQ is enabled");
            return false;
          }
        }

        addInstance(fields)
          .then((result) => {
            if (result.success) {
              showSuccess("Instance created successfully");
              // Refresh the instances list
              updateAdmin();
            } else {
              showError(
                "Failed to create instance: " +
                  (result.error || "Unknown error"),
              );
            }
          })
          .catch((error) => {
            showError("Error creating instance: " + error.message);
          });

        $("#addInstanceModal").modal("hide");
        $("#addInstanceForm").form("reset");
        $(".ui.dropdown").dropdown("restore defaults");

        // Reset event dropdowns properly
        resetEventDropdowns();

        // Reset toggles
        $("#addInstanceProxyToggle").checkbox("set unchecked");
        $("#addInstanceS3Toggle").checkbox("set unchecked");
        $("#addInstanceRabbitMQToggle").checkbox("set unchecked");
        $("#addInstanceSkipMediaToggle").checkbox("set unchecked");
        $("#addInstanceSkipGroupsToggle").checkbox("set unchecked");
        $("#addInstanceSkipNewslettersToggle").checkbox("set unchecked");
        $("#addInstanceSkipBroadcastsToggle").checkbox("set unchecked");
        $("#addInstanceSkipOwnMessagesToggle").checkbox("set unchecked");
        $("#addInstanceEchoApiToggle").checkbox("set unchecked");
        $("#addInstanceSkipCallsToggle").checkbox("set unchecked");
        $("#addInstanceWhatsAppToggle").checkbox("set unchecked");
        $("#addInstanceProxyUrlField").hide();
        $("#addInstanceS3Fields").hide();
        $("#addInstanceRabbitMQFields").hide();
        $("#addInstanceCallRejectFields").hide();
        $("#addInstanceCallMessageField").hide();
        $("#addInstanceWhatsAppFields").hide();

        // Reset RabbitMQ dropdowns to defaults
        $("#addInstanceRabbitMQExchangeType").dropdown("set selected", "topic");
        $("#addInstanceRabbitMQQueueType").dropdown("set selected", "classic");
        $("#addInstanceRabbitMQDeliveryMode").dropdown("set selected", "2");
        $("#addInstanceCallRejectType").dropdown("set selected", "busy");

        // Reset WhatsApp dropdowns to defaults
        $("#addInstanceWAPlatform").dropdown("clear");
        $("#addInstanceWAReleaseChannel").dropdown("clear");
        $("#addInstanceWAWebSubPlatform").dropdown("clear");
        $("#addInstanceWAConnectType").dropdown("clear");
        $("#addInstanceWAPlatformType").dropdown("clear");
      },
    });

    init();
  } catch (error) {
    console.error("Error initializing dashboard:", error);
    showError("Error initializing dashboard. Check console for more details.");
  }
});

async function addInstance(data) {
  const admintoken = getLocalStorageItem("admintoken");
  const myHeaders = new Headers();
  myHeaders.append("authorization", admintoken);
  myHeaders.append("Content-Type", "application/json");

  // Build proxy configuration
  const proxyEnabled =
    data.proxy_enabled === "on" || data.proxy_enabled === true;
  const proxyConfig = {
    enabled: proxyEnabled,
    proxyURL: proxyEnabled ? data.proxy_url || "" : "",
  };

  // Build S3 configuration
  const s3Enabled = data.s3_enabled === "on" || data.s3_enabled === true;
  const s3PathStyle =
    data.s3_path_style === "on" || data.s3_path_style === true;
  const s3DisableACL =
    data.s3_disable_acl === "on" || data.s3_disable_acl === true;
  const s3Config = {
    enabled: s3Enabled,
    endpoint: s3Enabled ? data.s3_endpoint || "" : "",
    region: s3Enabled ? data.s3_region || "" : "",
    bucket: s3Enabled ? data.s3_bucket || "" : "",
    accessKey: s3Enabled ? data.s3_access_key || "" : "",
    secretKey: s3Enabled ? data.s3_secret_key || "" : "",
    pathStyle: s3PathStyle,
    publicURL: s3Enabled ? data.s3_public_url || "" : "",
    mediaDelivery: s3Enabled ? data.media_delivery || "base64" : "base64",
    retentionDays: s3Enabled ? parseInt(data.s3_retention_days) || 30 : 30,
    disableACL: s3DisableACL,
  };

  // Build RabbitMQ configuration
  const rabbitmqEnabled =
    data.rabbitmq_enabled === "on" || data.rabbitmq_enabled === true;
  const rabbitmqDurable =
    data.rabbitmq_durable === "on" || data.rabbitmq_durable === true;
  const rabbitmqAutoDelete =
    data.rabbitmq_auto_delete === "on" || data.rabbitmq_auto_delete === true;
  const rabbitmqExclusive =
    data.rabbitmq_exclusive === "on" || data.rabbitmq_exclusive === true;
  const rabbitmqNoWait =
    data.rabbitmq_no_wait === "on" || data.rabbitmq_no_wait === true;

  let rabbitmqUrl = "";
  if (rabbitmqEnabled) {
    rabbitmqUrl = data.rabbitmq_url || "";
  }

  // Convert events array to string
  let eventsString = "";
  if (rabbitmqEnabled && data.rabbitmq_events) {
    const events = Array.isArray(data.rabbitmq_events)
      ? data.rabbitmq_events
      : [data.rabbitmq_events];
    eventsString = events.length > 0 ? events.join(",") : "All";
  }

  const rabbitmqConfig = {
    enabled: rabbitmqEnabled,
    url: rabbitmqEnabled ? data.rabbitmq_url || "" : "",
    exchange: rabbitmqEnabled ? data.rabbitmq_exchange || "" : "",
    exchange_type: rabbitmqEnabled
      ? data.rabbitmq_exchange_type || "topic"
      : "topic",
    queue: rabbitmqEnabled ? data.rabbitmq_queue || "" : "",
    queue_type: rabbitmqEnabled
      ? data.rabbitmq_queue_type || "classic"
      : "classic",
    routing_key: rabbitmqEnabled ? data.rabbitmq_routing_key || "" : "",
    events: eventsString,
    durable: rabbitmqDurable,
    auto_delete: rabbitmqAutoDelete,
    exclusive: rabbitmqExclusive,
    no_wait: rabbitmqNoWait,
    delivery_mode: rabbitmqEnabled
      ? parseInt(data.rabbitmq_delivery_mode) || 2
      : 2,
  };

  // Build WhatsApp configuration
  const whatsappEnabled =
    data.whatsapp_enabled === "on" || data.whatsapp_enabled === true;
  const whatsappConfig = {
    waVersion: whatsappEnabled ? data.wa_version || "" : "",
    waPlatform: whatsappEnabled ? data.wa_platform || "" : "",
    waReleaseChannel: whatsappEnabled ? data.wa_release_channel || "" : "",
    waWebSubPlatform: whatsappEnabled ? data.wa_web_sub_platform || "" : "",
    waOSName: whatsappEnabled ? data.wa_os_name || "" : "",
    waOSVersion: whatsappEnabled ? data.wa_os_version || "" : "",
    waDeviceName: whatsappEnabled ? data.wa_device_name || "" : "",
    waManufacturer: whatsappEnabled ? data.wa_manufacturer || "" : "",
    waDeviceBoard: whatsappEnabled ? data.wa_device_board || "" : "",
    waLocaleLanguage: whatsappEnabled ? data.wa_locale_language || "" : "",
    waLocaleCountry: whatsappEnabled ? data.wa_locale_country || "" : "",
    waMCC: whatsappEnabled ? data.wa_mcc || "" : "",
    waMNC: whatsappEnabled ? data.wa_mnc || "" : "",
    waConnectType: whatsappEnabled ? data.wa_connect_type || "" : "",
    waPlatformType: whatsappEnabled ? data.wa_platform_type || "" : "",
  };

  const payload = {
    name: data.name,
    token: data.token,
    events: data.events.join(","),
    webhook: data.webhook_url || "",
    expiration: 0,
    proxyConfig: proxyConfig,
    s3Config: s3Config,
    rabbitmqConfig: rabbitmqConfig,
    whatsappConfig: whatsappConfig,
    skipMedia: data.skip_media === "on" || data.skip_media === true,
    skipGroups: data.skip_groups === "on" || data.skip_groups === true,
    skipNewsletters:
      data.skip_newsletters === "on" || data.skip_newsletters === true,
    skipBroadcasts:
      data.skip_broadcasts === "on" || data.skip_broadcasts === true,
    skipOwnMessages:
      data.skip_own_messages === "on" || data.skip_own_messages === true,
    echoApiMessages:
      data.echo_api_messages === "on" || data.echo_api_messages === true,
    skipCalls: data.skip_calls === "on" || data.skip_calls === true,
    callRejectMessage:
      data.call_reject_message || "Sorry, I cannot take calls at the moment.",
    callRejectType: data.call_reject_type || "busy",
  };

  res = await fetch(baseUrl + "/admin/users", {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify(payload),
  });

  const responseData = await res.json();
  return responseData;
}

function webhookModal() {
  getWebhook().then((response) => {
    if (response.success == true) {
      $("#webhookEvents").addClass("updating");
      $("#webhookEvents").val(response.data.subscribe);
      $("#webhookEvents").dropdown("set selected", response.data.subscribe);
      setTimeout(() => {
        $("#webhookEvents").removeClass("updating");
        updateEventDropdownAppearance("#webhookEvents");
      }, 100);
      $("#webhookinput").val(response.data.webhook);
      $("#modalSetWebhook")
        .modal({
          onApprove: function () {
            setWebhook().then((result) => {
              if (result.success === true) {
                $.toast({
                  class: "success",
                  message: `Webhook set successfully !`,
                });
              } else {
                $.toast({
                  class: "error",
                  message: `Problem setting webhook: ${result.error}`,
                });
              }
            });
            return true;
          },
        })
        .modal("show");
    }
  });
}

function modalPairPhone() {
  $("#modalLoginWithCode")
    .modal({
      onVisible: function () {
        document.getElementById("pairInfo").classList.remove("hidden");
        document.getElementById("pairHelp").classList.remove("hidden");
        // Reset modal state
        document.getElementById("pairInfo").innerHTML = "How to pair?";
        document.getElementById("pairphoneinput").focus();
      },
      onHidden: function () {
        // Clean up pairing data when modal is closed
        removeLocalStorageItem("currentPairingToken");
        removeLocalStorageItem("currentPairingInstance");
        // Clear any running intervals
        if (window.currentPairInterval) {
          clearInterval(window.currentPairInterval);
          window.currentPairInterval = null;
        }
      },
    })
    .modal("show");
}

function handleRegularLogin(token, notifications = false) {
  setLocalStorageItem("token", token, 6);
  removeLocalStorageItem("isAdmin");
  $(".adminlogin").hide();
  statusRequest().then((status) => {
    if (status.success == true) {
      setLocalStorageItem("currentInstance", status.data.id, 6);
      // Save current user JID for groups functionality
      if (status.data.jid) {
        setLocalStorageItem("currentUserJID", status.data.jid, 6);
        window.currentUserJID = status.data.jid;
      }
      populateInstances([status.data]);
      showRegularUser();
      $(".logingrid").addClass("hidden");
      $(".admingrid").addClass("hidden");
      $(".maingrid").removeClass("hidden");
      $(".adminlogin").hide();
      showWidgets();
      // Do not auto-unhide any instance card here
      updateUser();
    } else {
      removeLocalStorageItem("token");
      showError("Invalid credentials");
      $("#loginToken").focus();
    }
  });
}

function updateUser() {
  // retrieves one instance status at regular interval
  status().then((result) => {
    if (result.success == true) {
      // Save current user JID for groups functionality
      if (result.data.jid) {
        setLocalStorageItem("currentUserJID", result.data.jid, 6);
        window.currentUserJID = result.data.jid;
      }
      populateInstances([result.data]);
    }
  });
  clearTimeout(updateUserTimeout);
  updateUserTimeout = setTimeout(function () {
    updateUser();
  }, updateInterval);
}

function updateAdmin() {
  // retrieves all instances status at regular intervals
  const current = getLocalStorageItem("currentInstance");
  if (!current) {
    // get all instances status
    getUsers().then((result) => {
      if (result.success == true) {
        populateInstances(result.data);
      }
    });
  } else {
    // get only active instance status
    status().then((result) => {
      if (result.success == true) {
        populateInstances([result.data]);
      }
    });
  }
  clearTimeout(updateAdminTimeout);
  updateAdminTimeout = setTimeout(function () {
    updateAdmin();
  }, updateInterval);
}

function handleAdminLogin(token, notifications = false) {
  setLocalStorageItem("admintoken", token, 6);
  setLocalStorageItem("isAdmin", true, 6);
  $(".adminlogin").show();
  const currentInstance = getLocalStorageItem("currentInstance");

  getUsers().then((result) => {
    if (result.success == true) {
      showAdminUser();

      if (currentInstance == null) {
        $(".admingrid").removeClass("hidden");
        populateInstances(result.data);
      } else {
        populateInstances(result.data);
        $(".maingrid").removeClass("hidden");
        showWidgets();
        const showInstanceId = `instance-card-${currentInstance}`;
        $("#" + showInstanceId).removeClass("hidden");
      }
      $("#loading").removeClass("active");
      $(".logingrid").addClass("hidden");
      updateAdmin();
    } else {
      removeLocalStorageItem("admintoken");
      removeLocalStorageItem("token");
      removeLocalStorageItem("isAdmin");
      showError("Admin login failed");
      $("#loginToken").focus();
    }
  });
}

function showError(message) {
  $("body").toast({
    class: "error",
    message: message,
    showIcon: "exclamation circle",
    position: "top center",
    showProgress: "bottom",
  });
}

function showSuccess(message) {
  $("body").toast({
    class: "success",
    message: message,
    showIcon: "check circle",
    position: "top center",
    showProgress: "bottom",
  });
}

function deleteInstance(id) {
  instanceToDelete = id;
  $("#deleteInstanceModal")
    .modal({
      onApprove: function () {
        performDelete(instanceToDelete);
      },
    })
    .modal("show");
}

async function performDelete(id) {
  const admintoken = getLocalStorageItem("admintoken");
  const myHeaders = new Headers();
  myHeaders.append("authorization", admintoken);
  myHeaders.append("Content-Type", "application/json");
  res = await fetch(baseUrl + "/admin/users/" + id + "/full", {
    method: "DELETE",
    headers: myHeaders,
  });
  data = await res.json();
  if (data.success === true) {
    $("#instance-row-" + id).remove();
    showDeleteSuccess();
  } else {
    showError("Error deleting instance");
  }
}

function showDeleteSuccess() {
  $("body").toast({
    class: "success",
    message: "Instance deleted successfully",
    position: "top right",
    showProgress: "bottom",
  });
}

function openDashboard(id, token) {
  setLocalStorageItem("currentInstance", id, 6);
  setLocalStorageItem("token", token, 6);
  $(`#instance-card-${id}`).removeClass("hidden");
  // Ensure control buttons are visible in the opened card
  ensureButtonsVisible(id);
  showWidgets();
  $(".admingrid").addClass("hidden");
  $(".maingrid").removeClass("hidden");
  $(".card.no-hover").addClass("hidden");
  $(`#instance-card-${id}`).removeClass("hidden");
  $(".adminlogin").show();
}

function goBackToList() {
  $("#instances-cards > div").addClass("hidden");
  removeLocalStorageItem("currentInstance");
  currentInstanceData = null; // Clear instance data
  updateAdmin();
  removeLocalStorageItem("token");
  hideWidgets();
  $(".maingrid").addClass("hidden");
  $(".admingrid").removeClass("hidden");
  $(".adminlogin").hide();
}

async function sendTextMessage() {
  const token = getLocalStorageItem("token");
  const sendPhone = document.getElementById("messagesendphone").value.trim();
  const sendBody = document.getElementById("messagesendtext").value;
  const myHeaders = new Headers();
  const uuid = generateMessageUUID();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");
  res = await fetch(baseUrl + "/chat/send/text", {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({ Phone: sendPhone, Body: sendBody, Id: uuid }),
  });
  data = await res.json();
  return data;
}

async function deleteMessage() {
  const deletePhone = document
    .getElementById("messagedeletephone")
    .value.trim();
  const deleteId = document.getElementById("messagedeleteid").value;
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");
  res = await fetch(baseUrl + "/chat/delete", {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({ Phone: deletePhone, Id: deleteId }),
  });
  data = await res.json();
  return data;
}

async function setWebhook() {
  const token = getLocalStorageItem("token");
  const webhook = document.getElementById("webhookinput").value.trim();
  let events = safeGetDropdownValues($("#webhookEvents").dropdown("get value"));

  if (events.includes("All")) {
    events = ["All"];
  }
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");
  res = await fetch(baseUrl + "/webhook", {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({ webhookurl: webhook, events: events }),
  });
  data = await res.json();
  return data;
}

async function deleteWebhook() {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  const res = await fetch(baseUrl + "/webhook", {
    method: "DELETE",
    headers: myHeaders,
  });
  return res.json();
}

function doUserAvatar() {
  const userAvatarInput = document.getElementById("useravatarinput");
  let phone = userAvatarInput.value.trim();
  if (phone) {
    if (!phone.endsWith("@s.whatsapp.net")) {
      phone = phone.includes("@")
        ? phone.split("@")[0] + "@s.whatsapp.net"
        : phone + "@s.whatsapp.net";
    }
    userAvatar(phone)
      .then((data) => {
        document
          .getElementById("userAvatarContainer")
          .classList.remove("hidden");
        if (data.success && data.data && data.data.url) {
          const userAvatarDiv = document.getElementById("userAvatarContainer");
          userAvatarDiv.innerHTML = `<img src="${data.data.url}" alt="Profile Picture" class="user-avatar">`;
        } else {
          document.getElementById("userAvatarContainer").innerHTML =
            "No user avatar found";
        }
      })
      .catch((error) => {
        document.getElementById("userAvatarContainer").innerHTML =
          "Error fetching user avatar";
        console.error("Error:", error);
      });
  }
}

// Improved User Info functionality
function doUserInfo() {
  if ($("#userinfoinput").val() === "") {
    showError("Please specify a phone number");
    return;
  }

  const phone = $("#userinfoinput").val();
  userInfo(phone)
    .then((data) => {
      document.getElementById("userInfoContainer").classList.remove("hidden");

      // Check the data structure - API agora retorna data.data.users (com 'u' minúsculo)
      let users = null;
      if (data && data.data && data.data.users) {
        users = data.data.users; // Nova estrutura da API
      } else if (data && data.Users) {
        users = data.Users; // Fallback para estrutura antiga
      } else if (data && data.data && data.data.Users) {
        users = data.data.Users; // Fallback adicional
      }

      if (users && Object.keys(users).length > 0) {
        displayUserInfo(users);
        showSuccess("User info fetched successfully");
      } else {
        document.getElementById("userInfoContainer").innerHTML =
          '<div class="ui warning message">No user data found for this phone number</div>';
      }
    })
    .catch((error) => {
      console.error("Error fetching user info:", error);
      document.getElementById("userInfoContainer").classList.remove("hidden");
      document.getElementById("userInfoContainer").innerHTML =
        '<div class="ui negative message">Error fetching user info. Please try again.</div>';
    });
}

// Business Profile functionality
function doBusinessProfile() {
  if ($("#phonebusinessfield").val() === "") {
    showError("Please specify a phone number");
    return;
  }

  const phone = $("#phonebusinessfield").val();
  businessProfile(phone);
}

async function businessProfile(phone) {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");

  try {
    const response = await fetch(baseUrl + "/user/business/profile", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify({
        phone: phone,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      document
        .getElementById("businessProfileResult")
        .classList.remove("hidden");
      displayBusinessProfile(data.data);
      showSuccess("Business profile fetched successfully");
    } else {
      let errorMessage = "Failed to fetch business profile";
      if (data.error) {
        errorMessage += ": " + data.error;
      } else if (response.status === 404) {
        errorMessage =
          "This number is not a WhatsApp Business account or does not have a public business profile";
      }
      document
        .getElementById("businessProfileResult")
        .classList.remove("hidden");
      document.getElementById("businessProfileResult").innerHTML =
        `<div class="ui negative message">${errorMessage}</div>`;
      showError(errorMessage);
    }
  } catch (error) {
    console.error("Error fetching business profile:", error);
    document.getElementById("businessProfileResult").classList.remove("hidden");
    document.getElementById("businessProfileResult").innerHTML =
      '<div class="ui negative message">Error fetching business profile. Please try again.</div>';
    showError("Error fetching business profile. Please try again.");
  }
}

function displayUserInfo(users) {
  // Clear previous results
  $("#userInfoContainer").html("");

  if (!users || Object.keys(users).length === 0) {
    $("#userInfoContainer").html(
      '<div class="ui warning message">No user information available</div>',
    );
    return;
  }

  // Container for all users
  let userInfoHtml = '<div class="ui segments">';

  // Iterate through each user
  Object.entries(users).forEach(([jid, userInfo], index) => {
    userInfoHtml += `
      <div class="ui segment">
        <h4 class="ui header">
          <i class="user icon"></i>
          <div class="content">
            User Information
            <div class="sub header">${jid}</div>
          </div>
        </h4>

        <div class="ui relaxed divided list">`;

    // WhatsApp account status
    userInfoHtml += `
      <div class="item">
        <i class="check green icon"></i>
        <div class="content">
          <div class="header">WhatsApp Account</div>
          <div class="description">Active</div>
        </div>
      </div>`;

    // Account type - Business or Personal
    userInfoHtml += `
      <div class="item">
        <i class="${userInfo.is_business_account ? "building" : "user outline"} icon"></i>
        <div class="content">
          <div class="header">Account Type</div>
          <div class="description">
            <div class="ui ${userInfo.is_business_account ? "blue" : "grey"} label">
              <i class="${userInfo.is_business_account ? "building" : "user"} icon"></i>
              ${userInfo.is_business_account ? "Business Account" : "Personal Account"}
            </div>
          </div>
        </div>
      </div>`;

    // Verified name (for business accounts)
    if (userInfo.verified_name) {
      userInfoHtml += `
        <div class="item">
          <i class="verified green icon"></i>
          <div class="content">
            <div class="header">Verified Business Name</div>
            <div class="description">
              <div class="ui green label">
                <i class="certificate icon"></i>
                ${userInfo.verified_name}
              </div>
            </div>
          </div>
        </div>`;
    }

    // Business name (if different from verified name)
    if (
      userInfo.business_name &&
      userInfo.business_name !== userInfo.verified_name
    ) {
      userInfoHtml += `
        <div class="item">
          <i class="building icon"></i>
          <div class="content">
            <div class="header">Business Name</div>
            <div class="description">${userInfo.business_name}</div>
          </div>
        </div>`;
    }

    // Status message
    if (userInfo.status) {
      userInfoHtml += `
        <div class="item">
          <i class="comment outline icon"></i>
          <div class="content">
            <div class="header">Status Message</div>
            <div class="description">${userInfo.status}</div>
          </div>
        </div>`;
    }

    // Profile picture
    if (userInfo.picture_id) {
      userInfoHtml += `
        <div class="item">
          <i class="image icon"></i>
          <div class="content">
            <div class="header">Profile Picture</div>
            <div class="description">
              <div class="ui tiny label">
                <i class="photo icon"></i>
                Available (ID: ${userInfo.picture_id})
              </div>
            </div>
          </div>
        </div>`;
    } else {
      userInfoHtml += `
        <div class="item">
          <i class="image outline icon"></i>
          <div class="content">
            <div class="header">Profile Picture</div>
            <div class="description">No profile picture available</div>
          </div>
        </div>`;
    }

    // Device count and first device
    if (userInfo.device_count > 0) {
      userInfoHtml += `
        <div class="item">
          <i class="mobile alternate icon"></i>
          <div class="content">
            <div class="header">Device Count</div>
            <div class="description">
              <div class="ui blue label">
                <i class="mobile alternate icon"></i>
                ${userInfo.device_count} device${userInfo.device_count > 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>`;
    }

    if (userInfo.first_device) {
      userInfoHtml += `
        <div class="item">
          <i class="star icon"></i>
          <div class="content">
            <div class="header">Primary Device</div>
            <div class="description">
              <code style="font-size: 0.9em; background: #f4f4f4; padding: 2px 4px; border-radius: 3px;">
                ${userInfo.first_device}
              </code>
            </div>
          </div>
        </div>`;
    }

    userInfoHtml += `</div>`;

    // Devices information with detailed structure
    if (userInfo.devices && userInfo.devices.length > 0) {
      userInfoHtml += `
        <h5 class="ui header">
          <i class="mobile alternate icon"></i>
          Connected Devices (${userInfo.devices.length})
        </h5>
        <div class="ui tiny segments">`;

      userInfo.devices.forEach((device, deviceIndex) => {
        // Get device icon and color based on platform
        let deviceIcon = "mobile alternate";
        let deviceColor = "blue";

        switch (device.device.toLowerCase()) {
          case "chrome":
            deviceIcon = "chrome";
            deviceColor = "green";
            break;
          case "firefox":
            deviceIcon = "firefox";
            deviceColor = "orange";
            break;
          case "safari":
            deviceIcon = "safari";
            deviceColor = "blue";
            break;
          case "edge":
            deviceIcon = "edge";
            deviceColor = "blue";
            break;
          case "opera":
            deviceIcon = "opera";
            deviceColor = "red";
            break;
          case "desktop":
            deviceIcon = "desktop";
            deviceColor = "purple";
            break;
          case "ipad":
          case "android_tablet":
            deviceIcon = "tablet alternate";
            deviceColor = "orange";
            break;
          case "unknown":
            deviceIcon = "question circle";
            deviceColor = "grey";
            break;
          default:
            deviceIcon = "mobile alternate";
            deviceColor = "blue";
        }

        userInfoHtml += `
          <div class="ui segment">
            <div class="ui ${deviceColor} ribbon label">Device ${deviceIndex + 1}</div>
            <div class="ui relaxed list">
              <div class="item">
                <i class="${deviceIcon} icon"></i>
                <div class="content">
                  <div class="header">${device.device || "Unknown"}</div>
                  <div class="description">Platform</div>
                </div>
              </div>`;

        if (device.user) {
          userInfoHtml += `
            <div class="item">
              <i class="user icon"></i>
              <div class="content">
                <div class="header">${device.user}</div>
                <div class="description">User ID</div>
              </div>
            </div>`;
        }

        if (device.jid) {
          userInfoHtml += `
            <div class="item">
              <i class="id card icon"></i>
              <div class="content">
                <div class="header">
                  <code style="font-size: 0.8em; background: #f4f4f4; padding: 1px 3px; border-radius: 2px;">
                    ${device.jid}
                  </code>
                </div>
                <div class="description">Device JID</div>
              </div>
            </div>`;
        }

        if (device.agent && device.agent !== "0") {
          userInfoHtml += `
            <div class="item">
              <i class="code icon"></i>
              <div class="content">
                <div class="header">${device.agent}</div>
                <div class="description">User Agent</div>
              </div>
            </div>`;
        }

        if (device.server) {
          userInfoHtml += `
            <div class="item">
              <i class="server icon"></i>
              <div class="content">
                <div class="header">${device.server}</div>
                <div class="description">Server</div>
              </div>
            </div>`;
        }

        if (device.ad) {
          userInfoHtml += `
            <div class="item">
              <i class="key icon"></i>
              <div class="content">
                <div class="header">
                  <code style="font-size: 0.8em; background: #f4f4f4; padding: 1px 3px; border-radius: 2px;">
                    ${device.ad}
                  </code>
                </div>
                <div class="description">Device Key</div>
              </div>
            </div>`;
        }

        userInfoHtml += `
            </div>
          </div>`;
      });

      userInfoHtml += `</div>`;
    } else {
      userInfoHtml += `
        <h5 class="ui header">
          <i class="mobile alternate icon"></i>
          Connected Devices
        </h5>
        <div class="ui info message">
          <i class="info circle icon"></i>
          No device information available
        </div>`;
    }

    // Account summary statistics
    userInfoHtml += `
      <div class="ui divider"></div>
      <div class="ui horizontal statistics">
        <div class="statistic">
          <div class="value">
            <i class="user ${userInfo.is_business_account ? "business" : "outline"} icon"></i>
          </div>
          <div class="label">
            ${userInfo.is_business_account ? "Business" : "Personal"}
          </div>
        </div>
        <div class="statistic">
          <div class="value">
            ${userInfo.device_count || 0}
          </div>
          <div class="label">
            Devices
          </div>
        </div>
        <div class="statistic">
          <div class="value">
            <i class="${userInfo.picture_id ? "check green" : "times red"} icon"></i>
          </div>
          <div class="label">
            Profile Picture
          </div>
        </div>
        ${
          userInfo.verified_name
            ? `
        <div class="statistic">
          <div class="value">
            <i class="verified green icon"></i>
          </div>
          <div class="label">
            Verified
          </div>
        </div>`
            : ""
        }
      </div>`;

    userInfoHtml += `</div>`;
  });

  userInfoHtml += `</div>`;

  $("#userInfoContainer").html(userInfoHtml);
}

function displayBusinessProfile(profile) {
  // Clear previous results
  $("#businessProfileResult").html("");

  if (!profile) {
    $("#businessProfileResult").html(
      '<div class="ui warning message">No business profile data available</div>',
    );
    return;
  }

  let profileHtml = `
    <div class="ui segment">
      <h4 class="ui header">
        <i class="building icon"></i>
        <div class="content">
          Business Profile Information
          <div class="sub header">${profile.jid}</div>
        </div>
      </h4>

      <div class="ui relaxed divided list">`;

  // Business account status
  profileHtml += `
    <div class="item">
      <i class="${profile.is_business_account ? "check green" : "times red"} icon"></i>
      <div class="content">
        <div class="header">Business Account</div>
        <div class="description">${profile.is_business_account ? "Yes" : "No"}</div>
      </div>
    </div>`;

  // Profile data availability
  if (profile.is_business_account) {
    profileHtml += `
      <div class="item">
        <i class="${profile.profile_data_available ? "check green" : "warning yellow"} icon"></i>
        <div class="content">
          <div class="header">Public Profile</div>
          <div class="description">${profile.profile_data_available ? "Available" : "Limited access or not public"}</div>
        </div>
      </div>`;
  }

  // Verified name
  if (profile.verified_name) {
    profileHtml += `
      <div class="item">
        <i class="verified green icon"></i>
        <div class="content">
          <div class="header">Verified Business Name</div>
          <div class="description">${profile.verified_name}</div>
        </div>
      </div>`;
  }

  // Email
  if (profile.email) {
    profileHtml += `
      <div class="item">
        <i class="mail icon"></i>
        <div class="content">
          <div class="header">Email</div>
          <div class="description">${profile.email}</div>
        </div>
      </div>`;
  }

  // Address
  if (profile.address) {
    profileHtml += `
      <div class="item">
        <i class="map marker icon"></i>
        <div class="content">
          <div class="header">Address</div>
          <div class="description">${profile.address}</div>
        </div>
      </div>`;
  }

  // Status
  if (profile.status) {
    profileHtml += `
      <div class="item">
        <i class="info circle icon"></i>
        <div class="content">
          <div class="header">Status</div>
          <div class="description">${profile.status}</div>
        </div>
      </div>`;
  }

  profileHtml += `</div>`;

  // Categories
  if (profile.categories && profile.categories.length > 0) {
    profileHtml += `
      <h5 class="ui header">
        <i class="tags icon"></i>
        Business Categories
      </h5>
      <div class="ui labels">`;

    profile.categories.forEach((category) => {
      profileHtml += `<div class="ui label">${category.name}</div>`;
    });

    profileHtml += `</div>`;
  }

  // Business Hours
  if (profile.business_hours && profile.business_hours.length > 0) {
    profileHtml += `
      <h5 class="ui header">
        <i class="clock icon"></i>
        Business Hours
        ${profile.business_hours_timezone ? `<div class="sub header">Timezone: ${profile.business_hours_timezone}</div>` : ""}
      </h5>
      <div class="ui tiny segments">`;

    const dayNames = {
      mon: "Monday",
      tue: "Tuesday",
      wed: "Wednesday",
      thu: "Thursday",
      fri: "Friday",
      sat: "Saturday",
      sun: "Sunday",
    };

    profile.business_hours.forEach((hours) => {
      const dayName = dayNames[hours.day_of_week] || hours.day_of_week;
      let timeInfo = hours.mode;

      if (hours.open_time && hours.close_time) {
        timeInfo = `${hours.open_time} - ${hours.close_time}`;
      } else if (hours.mode === "appointment_only") {
        timeInfo = "By appointment only";
      } else if (hours.mode === "closed") {
        timeInfo = "Closed";
      }

      profileHtml += `
        <div class="ui segment">
          <strong>${dayName}:</strong> ${timeInfo}
        </div>`;
    });

    profileHtml += `</div>`;
  }

  // Profile Options
  if (
    profile.profile_options &&
    Object.keys(profile.profile_options).length > 0
  ) {
    profileHtml += `
      <h5 class="ui header">
        <i class="cogs icon"></i>
        Profile Options
      </h5>
      <div class="ui relaxed list">`;

    Object.entries(profile.profile_options).forEach(([key, value]) => {
      const displayKey = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      const displayValue =
        value === "true" ? "Yes" : value === "false" ? "No" : value;

      profileHtml += `
        <div class="item">
          <div class="content">
            <div class="header">${displayKey}</div>
            <div class="description">${displayValue}</div>
          </div>
        </div>`;
    });

    profileHtml += `</div>`;
  }

  profileHtml += `</div>`;

  $("#businessProfileResult").html(profileHtml);
}

function showWidgets() {
  document.querySelectorAll(".widget").forEach((widget) => {
    widget.classList.remove("hidden");
  });
}

function hideWidgets() {
  document.querySelectorAll(".widget").forEach((widget) => {
    widget.classList.add("hidden");
  });
}

async function connect(token = "", customEvents = null) {
  if (token == "") {
    token = getLocalStorageItem("token");
  }

  // Get current events from webhook configuration if not provided
  let eventsToSend = customEvents || ["All"];
  if (!customEvents) {
    try {
      const webhookData = await getWebhook(token);
      if (
        webhookData.success &&
        webhookData.data &&
        webhookData.data.subscribe
      ) {
        eventsToSend = Array.isArray(webhookData.data.subscribe)
          ? webhookData.data.subscribe
          : [webhookData.data.subscribe];
      }
    } catch (error) {
      console.log("Could not get existing events, using All as default");
      eventsToSend = ["All"];
    }
  }

  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");
  res = await fetch(baseUrl + "/session/connect", {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({ Subscribe: eventsToSend, Immediate: true }),
  });
  data = await res.json();
  updateInterval = 1000; // Decrease interval to react quicker to QR scan
  return data;
}

async function disconnect(token) {
  if (token == "") {
    token = getLocalStorageItem("token");
  }
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");

  try {
    const res = await fetch(baseUrl + "/session/disconnect", {
      method: "POST",
      headers: myHeaders,
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error in disconnect function:", error);
    return { success: false, error: error.message };
  }
}

async function status() {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");
  res = await fetch(baseUrl + "/session/status", {
    method: "GET",
    headers: myHeaders,
  });
  data = await res.json();
  if (data.data.loggedIn == true) updateInterval = 5000;
  return data;
}

async function getUsers() {
  const admintoken = getLocalStorageItem("admintoken");
  const myHeaders = new Headers();
  myHeaders.append("authorization", admintoken);
  myHeaders.append("Content-Type", "application/json");
  res = await fetch(baseUrl + "/admin/users", {
    method: "GET",
    headers: myHeaders,
  });
  data = await res.json();
  return data;
}

async function getWebhook(token = "") {
  if (token == "") {
    token = getLocalStorageItem("token");
  }
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");
  try {
    const res = await fetch(baseUrl + "/webhook", {
      method: "GET",
      headers: myHeaders,
    });
    data = await res.json();
    return data;
  } catch (error) {
    return "{}";
    throw error;
  }
}

async function getContacts() {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");
  try {
    const res = await fetch(baseUrl + "/user/contacts", {
      method: "GET",
      headers: myHeaders,
    });
    data = await res.json();
    if (data.code === 200) {
      const transformedContacts = Object.entries(data.data).map(
        ([phone, contact]) => ({
          FullName: contact.FullName || "",
          PushName: contact.PushName || "",
          Phone: phone.split("@")[0], // Remove the @s.whatsapp.net part
        }),
      );
      downloadJson(transformedContacts, "contacts.json");
      return transformedContacts;
    } else {
      throw new Error(`API returned code ${data.code}`);
    }
  } catch (error) {
    console.error("Error fetching contacts:", error);
    throw error;
  }
}

async function userAvatar(phone) {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");
  res = await fetch(baseUrl + "/user/avatar", {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({ Phone: phone, Preview: false }),
  });
  data = await res.json();
  return data;
}

async function userInfo(phone) {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");

  try {
    const response = await fetch(baseUrl + "/user/info", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify({ Phone: [phone] }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch user info");
    }

    return data;
  } catch (error) {
    console.error("Error in userInfo function:", error);
    throw error;
  }
}

async function pairPhone(phone) {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");
  res = await fetch(baseUrl + "/session/pairphone", {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({ Phone: phone }),
  });
  data = await res.json();
  return data;
}

async function pairPhoneWithToken(phone, token) {
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");
  res = await fetch(baseUrl + "/session/pairphone", {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({ Phone: phone }),
  });
  data = await res.json();
  return data;
}

async function checkInstanceStatus(token) {
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");
  res = await fetch(baseUrl + "/session/status", {
    method: "GET",
    headers: myHeaders,
  });
  data = await res.json();
  return data;
}

async function logout(token = "") {
  if (token == "") {
    token = getLocalStorageItem("token");
  }
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");

  try {
    const res = await fetch(baseUrl + "/session/logout", {
      method: "POST",
      headers: myHeaders,
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error in logout function:", error);
    return { success: false, error: error.message };
  }
}

async function getQr() {
  const myHeaders = new Headers();
  const token = getLocalStorageItem("token");
  myHeaders.append("token", token);
  res = await fetch(baseUrl + "/session/qr", {
    method: "GET",
    headers: myHeaders,
  });
  data = await res.json();
  return data;
}

async function statusRequest() {
  const myHeaders = new Headers();
  const token = getLocalStorageItem("token");
  const isAdminLogin = getLocalStorageItem("isAdmin");
  if (token != null && isAdminLogin == null) {
    myHeaders.append("token", token);
    res = await fetch(baseUrl + "/session/status", {
      method: "GET",
      headers: myHeaders,
    });
    data = await res.json();
    return data;
  }
}

function parseURLParams(url) {
  var queryStart = url.indexOf("?") + 1,
    queryEnd = url.indexOf("#") + 1 || url.length + 1,
    query = url.slice(queryStart, queryEnd - 1),
    pairs = query.replace(/\+/g, " ").split("&"),
    parms = {},
    i,
    n,
    v,
    nv;

  if (query === url || query === "") return;
  for (i = 0; i < pairs.length; i++) {
    nv = pairs[i].split("=", 2);
    n = decodeURIComponent(nv[0]);
    v = decodeURIComponent(nv[1]);
    if (!parms.hasOwnProperty(n)) parms[n] = [];
    parms[n].push(nv.length === 2 ? v : null);
  }
  return parms;
}

function downloadJson(data, filename) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

function generateMessageUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Improved event dropdown change handler
function handleEventDropdownChange(dropdownSelector, value) {
  // Prevent processing if we're already updating to avoid loops
  const $dropdown = $(dropdownSelector);
  if ($dropdown.hasClass("updating")) {
    return;
  }

  try {
    // Mark as updating to prevent loops
    $dropdown.addClass("updating");

    // Get current values as array using the safe utility function
    let currentValues = safeGetDropdownValues(value);

    // Check if "All" was just selected
    if (currentValues.includes("All")) {
      // If "All" is selected, clear everything and set only "All"
      setTimeout(() => {
        $dropdown.dropdown("clear");
        $dropdown.dropdown("set selected", "All");
        $dropdown.removeClass("updating");

        // Add visual feedback and update appearance
        updateEventDropdownAppearance(dropdownSelector);
        showEventSelectionFeedback(dropdownSelector, "All events selected");
      }, 10);
      return;
    }

    // If other events are selected after "All" was selected, remove "All"
    if (currentValues.length > 1 && currentValues.includes("All")) {
      const filteredValues = currentValues.filter((v) => v !== "All");
      setTimeout(() => {
        $dropdown.dropdown("clear");
        $dropdown.dropdown("set selected", filteredValues);
        $dropdown.removeClass("updating");

        // Add visual feedback and update appearance
        updateEventDropdownAppearance(dropdownSelector);
        showEventSelectionFeedback(
          dropdownSelector,
          `${filteredValues.length} events selected`,
        );
      }, 10);
      return;
    }

    // Regular selection - just provide feedback
    setTimeout(() => {
      $dropdown.removeClass("updating");
      updateEventDropdownAppearance(dropdownSelector);
      if (currentValues.length > 0) {
        showEventSelectionFeedback(
          dropdownSelector,
          `${currentValues.length} event${currentValues.length > 1 ? "s" : ""} selected`,
        );
      }
    }, 10);
  } catch (error) {
    console.error("Error in handleEventDropdownChange:", error);
    $dropdown.removeClass("updating");
  }
}

// Show visual feedback for event selection
function showEventSelectionFeedback(dropdownSelector, message) {
  // Find the dropdown container
  const $dropdownContainer = $(dropdownSelector).closest(".field");

  // Remove any existing feedback
  $dropdownContainer.find(".selection-feedback").remove();

  // Get current selection for more detailed feedback
  const $dropdown = $(dropdownSelector);
  const selectedValues = $dropdown.dropdown("get value");
  const selectedArray = safeGetDropdownValues(selectedValues);

  let feedbackClass = "positive";
  let iconClass = "check circle";
  let enhancedMessage = message;

  // Enhanced messaging based on selection
  if (selectedArray.includes("All")) {
    enhancedMessage =
      "✨ All events selected - You'll receive all WhatsApp events";
    feedbackClass = "info";
    iconClass = "star";
  } else if (selectedArray.length === 0) {
    enhancedMessage = "⚠️ No events selected - You won't receive any events";
    feedbackClass = "warning";
    iconClass = "warning sign";
  } else if (selectedArray.length === 1) {
    enhancedMessage = `📋 ${selectedArray[0]} event selected`;
  } else if (selectedArray.length > 1) {
    enhancedMessage = `📋 ${selectedArray.length} events selected: ${selectedArray.slice(0, 3).join(", ")}${selectedArray.length > 3 ? "..." : ""}`;
  }

  // Add new feedback message with enhanced styling
  const $feedback =
    $(`<div class="ui mini ${feedbackClass} message selection-feedback" style="margin-top: 8px; border-radius: 6px;">
    <i class="${iconClass} icon"></i>
    <span class="feedback-text">${enhancedMessage}</span>
    ${selectedArray.length > 0 && !selectedArray.includes("All") ? `<span class="event-counter">${selectedArray.length}</span>` : ""}
  </div>`);

  $dropdownContainer.append($feedback);

  // Add animation and remove feedback after a longer period for better UX
  $feedback.hide().slideDown(200);

  setTimeout(() => {
    $feedback.slideUp(200, function () {
      $(this).remove();
    });
  }, 4000); // Increased time for users to read
}

// Add function to update event counter in label
function updateEventDropdownAppearance(dropdownSelector) {
  const $dropdown = $(dropdownSelector);
  const selectedValues = $dropdown.dropdown("get value");
  const selectedArray = safeGetDropdownValues(selectedValues);

  // Add visual indicators to the dropdown itself
  if (selectedArray.includes("All")) {
    $dropdown.addClass("all-events-selected");
    $dropdown.removeClass("partial-selection");
  } else if (selectedArray.length > 0) {
    $dropdown.addClass("partial-selection");
    $dropdown.removeClass("all-events-selected");
  } else {
    $dropdown.removeClass("all-events-selected partial-selection");
  }
}

// Initialize all event dropdowns with consistent behavior
function initializeEventDropdowns() {
  try {
    // List of all event dropdown selectors
    const eventDropdowns = [
      "#webhookEvents",
      "#webhookEventsInstance",
      "#addInstanceRabbitMQEvents",
      "#rabbitmqEvents",
    ];

    eventDropdowns.forEach((selector) => {
      try {
        const $dropdown = $(selector);
        if ($dropdown.length > 0) {
          // Initialize dropdown with our enhanced logic
          $dropdown.dropdown({
            onChange: function (value, text, $selectedItem) {
              try {
                handleEventDropdownChange(selector, value);
              } catch (error) {
                console.error("Error in dropdown onChange:", error);
              }
            },
            onShow: function () {
              // Add loading state
              $dropdown.addClass("loading");
            },
            onHide: function () {
              // Remove loading state
              $dropdown.removeClass("loading");
              // Update appearance when dropdown closes
              try {
                updateEventDropdownAppearance(selector);
              } catch (error) {
                console.error("Error updating dropdown appearance:", error);
              }
            },
          });

          // Set initial appearance
          try {
            updateEventDropdownAppearance(selector);
          } catch (error) {
            console.error("Error setting initial dropdown appearance:", error);
          }
        }
      } catch (error) {
        console.error("Error initializing dropdown:", selector, error);
      }
    });
  } catch (error) {
    console.error("Error in initializeEventDropdowns:", error);
  }
}

// Reset all event dropdowns to their default state
function resetEventDropdowns() {
  const eventDropdowns = [
    "#webhookEvents",
    "#webhookEventsInstance",
    "#addInstanceRabbitMQEvents",
    "#rabbitmqEvents",
  ];

  eventDropdowns.forEach((selector) => {
    const $dropdown = $(selector);
    if ($dropdown.length > 0) {
      $dropdown.addClass("updating");
      $dropdown.dropdown("clear");
      $dropdown.removeClass("all-events-selected partial-selection updating");

      // Remove any feedback messages
      $dropdown.closest(".field").find(".selection-feedback").remove();
    }
  });
}

function init() {
  // Starting
  let notoken = 0;
  let scanInterval;
  let token = getLocalStorageItem("token");
  let admintoken = getLocalStorageItem("admintoken");
  let isAdminLogin = getLocalStorageItem("isAdmin");
  $(".adminlogin").hide();

  if (token == null && admintoken == null) {
    $(".logingrid").removeClass("hidden");
    $(".maingrid").addClass("hidden");
  } else {
    if (isAdminLogin) {
      handleAdminLogin(admintoken);
    } else {
      handleRegularLogin(token);
    }
  }

  // Initialize status modals
  initializeStatusModals();

  // Initialize newsletter modals
  initializeNewsletterModals();
}

function populateInstances(instances) {
  const tableBody = $("#instances-body");
  const cardsContainer = $("#instances-cards"); // Assuming you have a container for cards
  tableBody.empty();
  cardsContainer.empty();
  const currentInstance = getLocalStorageItem("currentInstance");

  if (instances.length == 0) {
    const nodatarow =
      '<tr><td style="text-align:center;" colspan=5>No instances found</td></tr>';
    tableBody.append(nodatarow);
  }
  instances.forEach((instance) => {
    // Set default values for missing fields (wuzapi compatibility)
    instance.rabbitmq_config = instance.rabbitmq_config ?? { enabled: false };
    instance.skip_media_download = instance.skip_media_download ?? false;
    instance.skip_groups = instance.skip_groups ?? false;
    instance.skip_newsletters = instance.skip_newsletters ?? false;
    instance.skip_broadcasts = instance.skip_broadcasts ?? false;
    instance.skip_own_messages = instance.skip_own_messages ?? false;
    instance.skip_calls = instance.skip_calls ?? false;
    instance.proxy_config = instance.proxy_config ?? { enabled: false, proxy_url: "" };
    instance.s3_config = instance.s3_config ?? { enabled: false, bucket: "" };

    // Debug log for button visibility
    console.log("Instance Debug:", {
      id: instance.id,
      connected: instance.connected,
      loggedIn: instance.loggedIn,
      connectButton: !instance.connected,
      disconnectButton: instance.connected,
      pairButton: instance.connected && !instance.loggedIn,
    });

    const row = `
      <tr>
        <td>
          <div class="ui grid">
            <div class="three wide column">
              ${
                instance.avatar_url
                  ? `<img src="${instance.avatar_url}" alt="Avatar" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">`
                  : '<i class="user icon"></i>'
              }
            </div>
            <div class="thirteen wide column">
              ${instance.id}
            </div>
          </div>
        </td>
        <td>${instance.name}</td>
        <td><i class="${instance.connected ? "check green" : "times red"} icon"></i> <span class="status ${instance.connected}">${instance.connected ? "Yes" : "No"}</span></td>
        <td><i class="${instance.loggedIn ? "check green" : "times red"} icon"></i> <span class="status ${instance.loggedIn}">${instance.loggedIn ? "Yes" : "No"}</span></td>
        <td>
          <button class="ui primary button dashboard-button" onclick="openDashboard('${instance.id}', '${instance.token}')">
            <i class="external alternate icon"></i> Open
          </button>
          <button class="ui negative button dashboard-button" onclick="deleteInstance('${instance.id}')">
            <i class="trash alternate icon"></i> Delete
          </button>
        </td>
      </tr>
  `;
    tableBody.append(row);

    const card = `
      <div class="ui fluid card hidden no-hover" id="instance-card-${instance.id}" data-token="${instance.token}">
          <div class="content">
              <div class="ui ${instance.loggedIn ? "one" : "two"} column stackable grid">
                  <!-- Left Column - Instance Info -->
                  <div class="column">
                      <div class="header" style="font-size: 1.3em; margin-bottom: 0.5rem;">
                          ${instance.name}
                          <div class="ui labels" style="margin-top: 0.5em;">
                              <div class="ui ${instance.connected ? "green" : "red"} horizontal label">
                                  <i class="${instance.connected ? "check" : "times"} icon"></i>
                                  ${instance.connected ? "Connected" : "Disconnected"}
                              </div>
                              <div class="ui ${instance.loggedIn ? "green" : "red"} horizontal label">
                                  <i class="${instance.loggedIn ? "check" : "times"} icon"></i>
                                  ${instance.loggedIn ? "Logged In" : "Logged Out"}
                              </div>
                          </div>
                      </div>

                      <div class="meta" style="margin-bottom: 1rem;">Instance ID: ${instance.id}</div>

                      <div class="ui two column stackable grid">
                          <!-- Instance Info Column -->
                          <div class="column">
                              <h4 class="ui dividing header">
                                  <i class="info circle icon"></i>
                                  Instance Details
                              </h4>
                              <div class="ui relaxed list">
                                  <div class="item">
                                      <i class="key icon"></i>
                                      <div class="content">
                                          <div class="header">Token</div>
                                          <div class="description" style="word-break: break-all; font-family: monospace; font-size: 0.9em;">
                                              <div class="ui action input" style="width: 100%;">
                                                  <input type="password"
                                                         id="token-${instance.id}"
                                                         value="${instance.token}"
                                                         readonly
                                                         style="font-family: monospace; font-size: 0.9em; background: transparent; border: none; padding: 0;">
                                                  <button type="button"
                                                          class="ui icon button"
                                                          onclick="toggleTokenVisibility('${instance.id}')"
                                                          title="Show/Hide Token">
                                                      <i class="eye icon" id="eye-icon-${instance.id}"></i>
                                                  </button>
                                                  <button type="button"
                                                          class="ui icon button"
                                                          onclick="copyToken('${instance.id}')"
                                                          title="Copy Token">
                                                      <i class="copy icon"></i>
                                                  </button>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                                  <div class="item">
                                      <i class="phone icon"></i>
                                      <div class="content">
                                          <div class="header">JID</div>
                                          <div class="description">
${
  instance.avatar_url
    ? `<img src="${instance.avatar_url}" alt="Avatar" class="jid-avatar" style="margin-right: 8px; vertical-align: middle;">`
    : '<i class="user icon" style="margin-right: 8px;"></i>'
}${instance.jid || "Not available"}
                                          </div>
                                      </div>
                                  </div>
                                  <div class="item">
                                      <i class="linkify icon"></i>
                                      <div class="content">
                                          <div class="header">Webhook</div>
                                          <div class="description" style="word-break: break-all;">${instance.webhook || "Not configured"}</div>
                                      </div>
                                  </div>
                                  <div class="item">
                                      <i class="calendar check icon"></i>
                                      <div class="content">
                                          <div class="header">Events</div>
                                          <div class="description">${instance.events || "Not configured"}</div>
                                      </div>
                                  </div>
                              </div>
                          </div>

                          <!-- Configurations Column -->
                          <div class="column">
                              <h4 class="ui dividing header">
                                  <i class="cogs icon"></i>
                                  Configuration Status
                              </h4>
                              <div class="ui relaxed list">
                                  <div class="item">
                                      <i class="${instance.proxy_config.enabled ? "check green" : "times red"} icon"></i>
                                      <div class="content">
                                          <div class="header">Proxy</div>
                                          <div class="description">${instance.proxy_config.enabled ? `Enabled (${instance.proxy_config.proxy_url})` : "Disabled"}</div>
                                      </div>
                                  </div>
                                  <div class="item">
                                      <i class="${instance.s3_config.enabled ? "check green" : "times red"} icon"></i>
                                      <div class="content">
                                          <div class="header">S3 Storage</div>
                                          <div class="description">${instance.s3_config.enabled ? `Enabled (${instance.s3_config.bucket})` : "Disabled"}</div>
                                      </div>
                                  </div>
                                  <div class="item">
                                      <i class="${instance.rabbitmq_config.enabled ? "check green" : "times red"} icon"></i>
                                      <div class="content">
                                          <div class="header">RabbitMQ</div>
                                          <div class="description">${instance.rabbitmq_config.enabled ? "Enabled" : "Disabled"}</div>
                                      </div>
                                  </div>
                              </div>

                              <h4 class="ui dividing header">
                                  <i class="filter icon"></i>
                                  Event Filters
                              </h4>
                              <div class="ui compact labels">
                                  <div class="ui ${instance.skip_media_download === true ? "green" : "grey"} label">
                                      <i class="${instance.skip_media_download === true ? "check" : "times"} icon"></i>
                                      Skip Media
                                  </div>
                                  <div class="ui ${instance.skip_groups === true ? "green" : "grey"} label">
                                      <i class="${instance.skip_groups === true ? "check" : "times"} icon"></i>
                                      Skip Groups
                                  </div>
                                  <div class="ui ${instance.skip_newsletters === true ? "green" : "grey"} label">
                                      <i class="${instance.skip_newsletters === true ? "check" : "times"} icon"></i>
                                      Skip Newsletters
                                  </div>
                                  <div class="ui ${instance.skip_broadcasts === true ? "green" : "grey"} label">
                                      <i class="${instance.skip_broadcasts === true ? "check" : "times"} icon"></i>
                                      Skip Broadcasts
                                  </div>
                                  <div class="ui ${instance.skip_own_messages === true ? "green" : "grey"} label">
                                      <i class="${instance.skip_own_messages === true ? "check" : "times"} icon"></i>
                                      Skip Own Messages
                                  </div>
                                  <div class="ui ${instance.echo_api_messages === true ? "green" : "grey"} label">
                                      <i class="${instance.echo_api_messages === true ? "check" : "times"} icon"></i>
                                      Echo API Messages
                                  </div>
                                  <div class="ui ${instance.skip_calls === true ? "green" : "grey"} label">
                                      <i class="${instance.skip_calls === true ? "check" : "times"} icon"></i>
                                      Skip Calls
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>

                  <!-- Right Column - QR Code (only shown if not logged in) -->
                  ${
                    !instance.loggedIn
                      ? `
                  <div class="column" style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
                      <div class="ui segment" style="width: 100%; max-width: 200px; height: 200px; display: flex; justify-content: center; align-items: center;">
                        ${
                          instance.qrcode
                            ? `<img src="${instance.qrcode}" style="max-height: 100%; max-width: 100%;">
                      </div>
                      <div>
                        Open WhatsApp on your phone and tap<br/><i class="ellipsis vertical icon"></i>> Linked devices > Link a device.
                          `
                            : `<div class="ui icon header" style="text-align: center;">
                                    <i class="qrcode icon" style="font-size: 3em;"></i>
                                    <div class="sub header">QR Code will appear here</div>
                                </div>`
                        }
                      </div>
                    </div>
                    `
                      : `
                    <!--one column when no qr to display-->
                    `
                  }
                </div>
            </div>

            <div class="extra content">
              <div class="actions-container">
                <div class="actions-group">
                  <button class="ui primary button"
                          id="button-connect-${instance.id}"
                          onclick="connectInstance('${instance.id}', '${instance.token}')"
                          type="button">
                    <i class="plug icon"></i>Connect
                  </button>
                  <button class="ui secondary button"
                          id="button-refresh-${instance.id}"
                          onclick="refreshInstance('${instance.id}', '${instance.token}')"
                          type="button">
                    <i class="refresh icon"></i>Refresh
                  </button>
                  <button class="ui orange button"
                          id="button-disconnect-${instance.id}"
                          onclick="disconnectInstance('${instance.id}', '${instance.token}')"
                          type="button">
                    <i class="unlink icon"></i>Disconnect
                  </button>
                  <button class="ui negative button"
                          id="button-logout-${instance.id}"
                          onclick="logoutInstance('${instance.id}', '${instance.token}')"
                          type="button">
                    <i class="sign out icon"></i>Logout
                  </button>
                  <button class="ui blue button"
                          id="button-pair-${instance.id}"
                          onclick="openPairModal('${instance.id}', '${instance.token}')"
                          type="button">
                    <i class="mobile icon"></i>Pair Phone
                  </button>
                </div>
              </div>
            </div>
        `;
    cardsContainer.append(card);
    // Safety: if actions block didn't render for any reason, build it now
    ensureActionsBlockById(instance.id);
  });
  if (currentInstance !== null) {
    const showInstanceId = `instance-card-${currentInstance}`;
    $(`#${showInstanceId}`).removeClass("hidden");
    // Store current instance data globally for use in modals
    const currentInstanceObj = instances.find(
      (inst) => inst.id === currentInstance,
    );
    if (currentInstanceObj) {
      currentInstanceData = currentInstanceObj;
    }
    // Make sure the actions are visible for the selected card
    ensureButtonsVisible(currentInstance);
  }
}

// Create actions block if missing in extra content (by instance id)
function ensureActionsBlockById(instanceId) {
  try {
    const cardEl = document.getElementById(`instance-card-${instanceId}`);
    if (!cardEl) return;
    const extra = cardEl.querySelector(".extra.content");
    if (!extra) return;

    // Only create if actions-group doesn't exist
    if (!extra.querySelector(".actions-group")) {
      const token = cardEl.dataset.token || "";
      extra.innerHTML = `
        <div class="actions-container">
          <div class="actions-group">
            <button class="ui primary button"
                    id="button-connect-${instanceId}"
                    onclick="connectInstance('${instanceId}', '${token}')"
                    type="button">
              <i class="plug icon"></i>Connect
            </button>
            <button class="ui secondary button"
                    id="button-refresh-${instanceId}"
                    onclick="refreshInstance('${instanceId}', '${token}')"
                    type="button">
              <i class="refresh icon"></i>Refresh
            </button>
            <button class="ui orange button"
                    id="button-disconnect-${instanceId}"
                    onclick="disconnectInstance('${instanceId}', '${token}')"
                    type="button">
              <i class="unlink icon"></i>Disconnect
            </button>
            <button class="ui negative button"
                    id="button-logout-${instanceId}"
                    onclick="logoutInstance('${instanceId}', '${token}')"
                    type="button">
              <i class="sign out icon"></i>Logout
            </button>
            <button class="ui blue button"
                    id="button-pair-${instanceId}"
                    onclick="openPairModal('${instanceId}', '${token}')"
                    type="button">
              <i class="mobile icon"></i>Pair Phone
            </button>
          </div>
        </div>`;
    }
  } catch (e) {
    console.warn("ensureActionsBlock error", e);
  }
}

// Force-ensure the action buttons in a card are visible
function ensureButtonsVisible(instanceId) {
  try {
    const cardElement = $(`#instance-card-${instanceId}`);
    if (cardElement.length === 0) {
      console.warn(`Card instance-card-${instanceId} not found`);
      return;
    }

    // Make sure actions block exists first
    ensureActionsBlockById(instanceId);

    // Show the card and button sections
    cardElement.removeClass("hidden").show();
    cardElement.find(".extra.content").show().css({
      display: "block",
      visibility: "visible",
    });

    cardElement.find(".actions-container").show().css({
      display: "block",
      visibility: "visible",
    });

    cardElement.find(".actions-group").show().css({
      display: "flex",
      visibility: "visible",
    });

    // Ensure all buttons are visible and functional
    const buttonIds = [
      `button-connect-${instanceId}`,
      `button-refresh-${instanceId}`,
      `button-disconnect-${instanceId}`,
      `button-logout-${instanceId}`,
      `button-pair-${instanceId}`,
    ];

    buttonIds.forEach((id) => {
      const button = $(`#${id}`);
      if (button.length > 0) {
        button.removeClass("hidden").show().css({
          display: "inline-flex",
          visibility: "visible",
          opacity: "1",
        });
      } else {
        console.warn(`Button ${id} not found`);
      }
    });

    console.log(`Buttons for instance ${instanceId} set to visible`);
  } catch (e) {
    console.error("Error in ensureButtonsVisible:", e);
  }
}

/**
 * Set an item in localStorage with expiry time (in hours)
 * @param {string} key - Key to store under
 * @param {*} value - Value to store
 * @param {number} hours - Expiry time in hours (default: 1 hour)
 */
function setLocalStorageItem(key, value, hours = 1) {
  const now = new Date();
  const expiryTime = now.getTime() + hours * 60 * 60 * 1000; // Convert hours to milliseconds

  const item = {
    value: value,
    expiry: expiryTime,
  };

  localStorage.setItem(key, JSON.stringify(item));
}

/**
 * Get an item from localStorage. Returns null if expired or not found.
 * @param {string} key - Key to retrieve
 * @returns {*|null} - Stored value or null
 */
function getLocalStorageItem(key) {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;

  try {
    const item = JSON.parse(itemStr);
    const now = new Date().getTime();

    // Check if expired (only if the parsed item has an expiry property)
    if (item.expiry && now > item.expiry) {
      localStorage.removeItem(key); // Clean up expired item
      return null;
    }

    // Return value only if the parsed item has a value property
    return item.value !== undefined ? item.value : null;
  } catch (e) {
    // If JSON parsing fails, treat it as not found
    return null;
  }
}

/**
 * Remove an item from localStorage
 * @param {string} key - Key to remove
 */
function removeLocalStorageItem(key) {
  localStorage.removeItem(key);
}

/**
 * Clear all localStorage items (with or without expiry)
 */
function clearLocalStorage() {
  localStorage.clear();
}

function showAdminUser() {
  const indicator = document.getElementById("user-role-indicator");
  const text = document.getElementById("user-role-text");

  indicator.className = "item admin";
  indicator.innerHTML = `
    <i class="user shield icon"></i>
    <div class="ui mini label">ADMIN</div>
  `;
}

function showRegularUser() {
  const indicator = document.getElementById("user-role-indicator");
  const text = document.getElementById("user-role-text");

  indicator.className = "item user";
  indicator.innerHTML = `
    <i class="user icon"></i>
    <div class="ui mini label">USER</div>
  `;
}

// S3 Configuration Functions
async function loadS3Config() {
  // Check if we have instance data available (admin viewing specific instance)
  if (currentInstanceData && currentInstanceData.s3_config) {
    const s3Config = currentInstanceData.s3_config;
    const hasConfig = s3Config.enabled || s3Config.endpoint || s3Config.bucket;

    $("#s3Endpoint").val(s3Config.endpoint || "");
    $("#s3AccessKey").val(
      s3Config.access_key === "***" ? "" : s3Config.access_key || "",
    );
    $("#s3SecretKey").val(""); // Never show secret key
    $("#s3Bucket").val(s3Config.bucket || "");
    $("#s3Region").val(s3Config.region || "");
    $("#s3ForcePathStyle").prop("checked", s3Config.path_style || false);
    $("#s3DisableACL").prop("checked", s3Config.disable_acl || false);
    $("#s3PublicUrl").val(s3Config.public_url || "");

    // Media delivery dropdown
    $("#s3MediaDelivery").dropdown(
      "set selected",
      s3Config.media_delivery || "base64",
    );

    // Retention days
    $("#s3RetentionDays").val(s3Config.retention_days || 30);

    // Show/hide delete button based on whether config exists
    if (hasConfig) {
      $("#deleteS3Config").show();
    } else {
      $("#deleteS3Config").hide();
    }

    return;
  }

  // Fallback to API call for regular users or when instance data is not available
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);

  try {
    const res = await fetch(baseUrl + "/session/s3/config", {
      method: "GET",
      headers: myHeaders,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.code === 200 && data.data) {
        const hasConfig =
          data.data.enabled || data.data.endpoint || data.data.bucket;

        $("#s3Endpoint").val(data.data.endpoint || "");
        $("#s3AccessKey").val(
          data.data.access_key === "***" ? "" : data.data.access_key,
        );
        $("#s3SecretKey").val(""); // Never show secret key
        $("#s3Bucket").val(data.data.bucket || "");
        $("#s3Region").val(data.data.region || "");
        $("#s3ForcePathStyle").prop("checked", data.data.path_style || false);
        $("#s3DisableACL").prop("checked", data.data.disable_acl || false);
        $("#s3PublicUrl").val(data.data.public_url || "");

        // Media delivery dropdown
        $("#s3MediaDelivery").dropdown(
          "set selected",
          data.data.media_delivery || "base64",
        );

        // Retention days
        $("#s3RetentionDays").val(data.data.retention_days || 30);

        // Show/hide delete button based on whether config exists
        if (hasConfig) {
          $("#deleteS3Config").show();
        } else {
          $("#deleteS3Config").hide();
        }
      } else {
        // No config found, hide delete button and set defaults
        $("#deleteS3Config").hide();
        $("#s3Endpoint").val("");
        $("#s3AccessKey").val("");
        $("#s3SecretKey").val("");
        $("#s3Bucket").val("");
        $("#s3Region").val("");
        $("#s3ForcePathStyle").prop("checked", false);
        $("#s3DisableACL").prop("checked", false);
        $("#s3PublicUrl").val("");
        $("#s3MediaDelivery").dropdown("set selected", "base64");
        $("#s3RetentionDays").val(30);
      }
    }
  } catch (error) {
    console.error("Error loading S3 config:", error);
    $("#deleteS3Config").hide();
  }
}

async function saveS3Config() {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");

  const config = {
    enabled: true,
    endpoint: $("#s3Endpoint").val().trim(),
    access_key: $("#s3AccessKey").val().trim(),
    secret_key: $("#s3SecretKey").val().trim(),
    bucket: $("#s3Bucket").val().trim(),
    region: $("#s3Region").val().trim(),
    path_style: $("#s3ForcePathStyle").is(":checked"),
    disable_acl: $("#s3DisableACL").is(":checked"),
    public_url: $("#s3PublicUrl").val().trim(),
    media_delivery: $("#s3MediaDelivery").val() || "base64",
    retention_days: parseInt($("#s3RetentionDays").val()) || 30,
  };

  try {
    const res = await fetch(baseUrl + "/session/s3/config", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(config),
    });

    const data = await res.json();
    if (data.success) {
      showSuccess("S3 configuration saved successfully");
      // Show delete button since we now have a configuration
      $("#deleteS3Config").show();
      $("#modalS3Config").modal("hide");
    } else {
      showError(
        "Failed to save S3 configuration: " + (data.error || "Unknown error"),
      );
    }
  } catch (error) {
    showError("Error saving S3 configuration");
    console.error("Error:", error);
  }
}

async function testS3Connection() {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);

  // Show loading state
  $("#testS3Connection").addClass("loading disabled");

  try {
    const res = await fetch(baseUrl + "/session/s3/test", {
      method: "POST",
      headers: myHeaders,
    });

    const data = await res.json();
    if (data.success) {
      showSuccess("S3 connection test successful!");
    } else {
      showError(
        "S3 connection test failed: " + (data.error || "Unknown error"),
      );
    }
  } catch (error) {
    showError("Error testing S3 connection");
    console.error("Error:", error);
  } finally {
    $("#testS3Connection").removeClass("loading disabled");
  }
}

async function deleteS3Config() {
  // Show confirmation dialog
  if (
    !confirm(
      "Are you sure you want to delete the S3 configuration? This action cannot be undone.",
    )
  ) {
    return;
  }

  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);

  // Show loading state
  $("#deleteS3Config").addClass("loading disabled");

  try {
    const res = await fetch(baseUrl + "/session/s3/config", {
      method: "DELETE",
      headers: myHeaders,
    });

    const data = await res.json();
    if (data.success) {
      showSuccess("S3 configuration deleted successfully");

      // Clear all form fields
      $("#s3Endpoint").val("");
      $("#s3AccessKey").val("");
      $("#s3SecretKey").val("");
      $("#s3Bucket").val("");
      $("#s3Region").val("");
      $("#s3ForcePathStyle").prop("checked", false);
      $("#s3DisableACL").prop("checked", false);
      $("#s3PublicUrl").val("");
      $("#s3MediaDelivery").dropdown("set selected", "base64");
      $("#s3RetentionDays").val(30);

      // Hide delete button
      $("#deleteS3Config").hide();

      $("#modalS3Config").modal("hide");
    } else {
      showError(
        "Failed to delete S3 configuration: " + (data.error || "Unknown error"),
      );
    }
  } catch (error) {
    showError("Error deleting S3 configuration");
    console.error("Error:", error);
  } finally {
    $("#deleteS3Config").removeClass("loading disabled");
  }
}

// Proxy Configuration Functions
async function loadProxyConfig() {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);

  try {
    // Get user status to check proxy_config
    const res = await fetch(baseUrl + "/session/status", {
      method: "GET",
      headers: myHeaders,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.code === 200 && data.data && data.data.proxy_config) {
        const proxyConfig = data.data.proxy_config;
        const proxyUrl = proxyConfig.proxy_url || "";
        const enabled = proxyConfig.enabled || false;

        // Set checkbox state
        $("#proxyEnabled").prop("checked", enabled);
        $("#proxyEnabledToggle").checkbox(
          enabled ? "set checked" : "set unchecked",
        );

        // Set proxy URL
        $("#proxyUrl").val(proxyUrl);

        // Show/hide URL field based on enabled state
        if (enabled) {
          $("#proxyUrlField").addClass("show");
        } else {
          $("#proxyUrlField").removeClass("show");
        }
      } else {
        // No proxy config, set defaults
        $("#proxyEnabled").prop("checked", false);
        $("#proxyEnabledToggle").checkbox("set unchecked");
        $("#proxyUrl").val("");
        $("#proxyUrlField").removeClass("show");
      }
    }
  } catch (error) {
    console.error("Error loading proxy config:", error);
  }
}

async function saveProxyConfig() {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");

  const enabled = $("#proxyEnabled").is(":checked");
  const proxyUrl = $("#proxyUrl").val().trim();

  // If proxy is disabled, send disable request
  if (!enabled) {
    const config = {
      enable: false,
      proxy_url: "",
    };

    try {
      const res = await fetch(baseUrl + "/session/proxy", {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(config),
      });

      const data = await res.json();
      if (data.success) {
        showSuccess("Proxy disabled successfully");
        $("#modalProxyConfig").modal("hide");
      } else {
        showError(
          "Failed to disable proxy: " + (data.error || "Unknown error"),
        );
      }
    } catch (error) {
      showError("Error disabling proxy");
      console.error("Error:", error);
    }
    return;
  }

  // If enabled, validate proxy URL
  if (!proxyUrl) {
    showError("Proxy URL is required when proxy is enabled");
    return;
  }

  // Validate proxy URL has correct protocol
  if (
    !proxyUrl.startsWith("http://") &&
    !proxyUrl.startsWith("https://") &&
    !proxyUrl.startsWith("socks5://")
  ) {
    showError("Proxy URL must start with http://, https://, or socks5://");
    return;
  }

  const config = {
    enable: true,
    proxy_url: proxyUrl,
  };

  try {
    const res = await fetch(baseUrl + "/session/proxy", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(config),
    });

    const data = await res.json();
    if (data.success) {
      showSuccess("Proxy configuration saved successfully");
      $("#modalProxyConfig").modal("hide");
    } else {
      showError(
        "Failed to save proxy configuration: " +
          (data.error || "Unknown error"),
      );
    }
  } catch (error) {
    showError("Error saving proxy configuration");
    console.error("Error:", error);
  }
}

// RabbitMQ Configuration Functions
async function loadRabbitMQConfig() {
  // Check if we have instance data available (admin viewing specific instance)
  if (currentInstanceData && currentInstanceData.rabbitmq_config) {
    const rabbitmqConfig = currentInstanceData.rabbitmq_config;
    const hasConfig =
      rabbitmqConfig.enabled || rabbitmqConfig.url || rabbitmqConfig.exchange;

    // Set URL directly
    $("#rabbitmqUrl").val(rabbitmqConfig.url || "");

    $("#rabbitmqExchange").val(rabbitmqConfig.exchange || "");
    $("#rabbitmqRoutingKey").val(rabbitmqConfig.routing_key || "");
    $("#rabbitmqQueue").val(rabbitmqConfig.queue || "");
    $("#rabbitmqDurable").prop("checked", rabbitmqConfig.durable || false);
    $("#rabbitmqAutoDelete").prop(
      "checked",
      rabbitmqConfig.auto_delete || false,
    );
    $("#rabbitmqExclusive").prop("checked", rabbitmqConfig.exclusive || false);
    $("#rabbitmqNoWait").prop("checked", rabbitmqConfig.no_wait || false);

    // Set exchange type dropdown
    if (rabbitmqConfig.exchange_type) {
      $("#rabbitmqExchangeType").dropdown(
        "set selected",
        rabbitmqConfig.exchange_type,
      );
    } else {
      $("#rabbitmqExchangeType").dropdown("set selected", "topic"); // Default to topic
    }

    // Set queue type dropdown
    if (rabbitmqConfig.queue_type) {
      $("#rabbitmqQueueType").dropdown(
        "set selected",
        rabbitmqConfig.queue_type,
      );
    } else {
      $("#rabbitmqQueueType").dropdown("set selected", "classic"); // Default to classic
    }

    // Set delivery mode dropdown
    if (rabbitmqConfig.delivery_mode) {
      $("#rabbitmqDeliveryMode").dropdown(
        "set selected",
        String(rabbitmqConfig.delivery_mode),
      );
    } else {
      $("#rabbitmqDeliveryMode").dropdown("set selected", "2"); // Default to persistent
    }

    // Events dropdown - handle string format
    if (rabbitmqConfig.events) {
      let eventsArray = [];
      if (typeof rabbitmqConfig.events === "string") {
        if (rabbitmqConfig.events === "All") {
          eventsArray = ["All"];
        } else {
          eventsArray = rabbitmqConfig.events.split(",").map((e) => e.trim());
        }
      } else if (Array.isArray(rabbitmqConfig.events)) {
        eventsArray = rabbitmqConfig.events;
      }

      if (eventsArray.length > 0) {
        $("#rabbitmqEvents").addClass("updating");
        $("#rabbitmqEvents").dropdown("set selected", eventsArray);
        setTimeout(() => $("#rabbitmqEvents").removeClass("updating"), 100);
      } else {
        $("#rabbitmqEvents").dropdown("clear");
      }
    } else {
      $("#rabbitmqEvents").dropdown("clear");
    }

    // Show/hide delete button based on whether config exists
    if (hasConfig) {
      $("#deleteRabbitMQConfig").show();
    } else {
      $("#deleteRabbitMQConfig").hide();
    }

    return;
  }

  // Fallback to API call for regular users or when instance data is not available
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);

  try {
    const res = await fetch(baseUrl + "/session/rabbitmq/config", {
      method: "GET",
      headers: myHeaders,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.code === 200 && data.config) {
        const configData = data.config;
        if (configData) {
          const hasConfig =
            configData.enabled || configData.url || configData.exchange;

          // Set URL directly
          $("#rabbitmqUrl").val(configData.url || "");

          $("#rabbitmqExchange").val(configData.exchange || "");
          $("#rabbitmqRoutingKey").val(configData.routing_key || "");
          $("#rabbitmqQueue").val(configData.queue || "");
          $("#rabbitmqDurable").prop("checked", configData.durable || false);
          $("#rabbitmqAutoDelete").prop(
            "checked",
            configData.auto_delete || false,
          );
          $("#rabbitmqExclusive").prop(
            "checked",
            configData.exclusive || false,
          );
          $("#rabbitmqNoWait").prop("checked", configData.no_wait || false);

          // Set exchange type dropdown
          if (configData.exchange_type) {
            $("#rabbitmqExchangeType").dropdown(
              "set selected",
              configData.exchange_type,
            );
          } else {
            $("#rabbitmqExchangeType").dropdown("set selected", "topic"); // Default to topic
          }

          // Set queue type dropdown
          if (configData.queue_type) {
            $("#rabbitmqQueueType").dropdown(
              "set selected",
              configData.queue_type,
            );
          } else {
            $("#rabbitmqQueueType").dropdown("set selected", "classic"); // Default to classic
          }

          // Set delivery mode dropdown
          if (configData.delivery_mode) {
            $("#rabbitmqDeliveryMode").dropdown(
              "set selected",
              String(configData.delivery_mode),
            );
          } else {
            $("#rabbitmqDeliveryMode").dropdown("set selected", "2"); // Default to persistent
          }

          // Events dropdown - handle string format
          if (configData.events) {
            let eventsArray = [];
            if (typeof configData.events === "string") {
              if (configData.events === "All") {
                eventsArray = ["All"];
              } else {
                eventsArray = configData.events.split(",").map((e) => e.trim());
              }
            } else if (Array.isArray(configData.events)) {
              eventsArray = configData.events;
            }

            if (eventsArray.length > 0) {
              $("#rabbitmqEvents").addClass("updating");
              $("#rabbitmqEvents").dropdown("set selected", eventsArray);
              setTimeout(
                () => $("#rabbitmqEvents").removeClass("updating"),
                100,
              );
            } else {
              $("#rabbitmqEvents").dropdown("clear");
            }
          } else {
            $("#rabbitmqEvents").dropdown("clear");
          }

          // Advanced settings
          $("#rabbitmqConnectionPoolSize").val(
            configData.connection_pool_size || "",
          );
          $("#rabbitmqWorkerCount").val(configData.worker_count || "");
          $("#rabbitmqQueueBufferSize").val(configData.queue_buffer_size || "");
          $("#rabbitmqBatchSize").val(configData.batch_size || "");
          $("#rabbitmqBatchTimeoutMs").val(configData.batch_timeout_ms || "");
          $("#rabbitmqPublishTimeoutMs").val(
            configData.publish_timeout_ms || "",
          );
          $("#rabbitmqMaxRetries").val(configData.max_retries || "");
          $("#rabbitmqRetryDelayMs").val(configData.retry_delay_ms || "");

          // Show/hide delete button based on whether config exists
          if (hasConfig) {
            $("#deleteRabbitMQConfig").show();
          } else {
            $("#deleteRabbitMQConfig").hide();
          }
        }
      } else {
        // No config found, hide delete button and set defaults
        $("#deleteRabbitMQConfig").hide();
        $("#rabbitmqUrl").val("");
        $("#rabbitmqExchange").val("");
        $("#rabbitmqExchangeType").dropdown("set selected", "topic");
        $("#rabbitmqQueueType").dropdown("set selected", "classic");
        $("#rabbitmqDeliveryMode").dropdown("set selected", "2");
        $("#rabbitmqRoutingKey").val("");
        $("#rabbitmqQueue").val("");
        $("#rabbitmqDurable").prop("checked", true);
        $("#rabbitmqAutoDelete").prop("checked", false);
        $("#rabbitmqExclusive").prop("checked", false);
        $("#rabbitmqNoWait").prop("checked", false);

        $("#rabbitmqEvents").dropdown("clear");
      }
    }
  } catch (error) {
    console.error("Error loading RabbitMQ config:", error);
    $("#deleteRabbitMQConfig").hide();
    // Set default exchange type on error
    $("#rabbitmqExchangeType").dropdown("set selected", "topic");
  }
}

async function saveRabbitMQConfig() {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");

  // Get URL directly from input
  const url = $("#rabbitmqUrl").val().trim();

  if (!url) {
    showError("RabbitMQ URL is required");
    return;
  }

  // Get events as string using safe utility function
  const selectedEvents = safeGetDropdownValues(
    $("#rabbitmqEvents").dropdown("get value"),
  );
  const eventsString =
    selectedEvents.length > 0 ? selectedEvents.join(",") : "All";

  const config = {
    enabled: true,
    url: url,
    exchange: $("#rabbitmqExchange").val().trim(),
    exchange_type: $("#rabbitmqExchangeType").val() || "topic",
    queue: $("#rabbitmqQueue").val().trim(),
    queue_type: $("#rabbitmqQueueType").val() || "classic",
    routing_key: $("#rabbitmqRoutingKey").val().trim(),
    events: eventsString,
    durable: $("#rabbitmqDurable").is(":checked"),
    auto_delete: $("#rabbitmqAutoDelete").is(":checked"),
    exclusive: $("#rabbitmqExclusive").is(":checked"),
    no_wait: $("#rabbitmqNoWait").is(":checked"),
    delivery_mode: parseInt($("#rabbitmqDeliveryMode").val()) || 2,
  };

  // Optional advanced settings
  const connPool = parseInt($("#rabbitmqConnectionPoolSize").val());
  if (!isNaN(connPool)) config.connection_pool_size = connPool;
  const workerCount = parseInt($("#rabbitmqWorkerCount").val());
  if (!isNaN(workerCount)) config.worker_count = workerCount;
  const queueBuf = parseInt($("#rabbitmqQueueBufferSize").val());
  if (!isNaN(queueBuf)) config.queue_buffer_size = queueBuf;
  const batchSize = parseInt($("#rabbitmqBatchSize").val());
  if (!isNaN(batchSize)) config.batch_size = batchSize;
  const batchTimeout = parseInt($("#rabbitmqBatchTimeoutMs").val());
  if (!isNaN(batchTimeout)) config.batch_timeout_ms = batchTimeout;
  const publishTimeout = parseInt($("#rabbitmqPublishTimeoutMs").val());
  if (!isNaN(publishTimeout)) config.publish_timeout_ms = publishTimeout;
  const maxRetries = parseInt($("#rabbitmqMaxRetries").val());
  if (!isNaN(maxRetries)) config.max_retries = maxRetries;
  const retryDelay = parseInt($("#rabbitmqRetryDelayMs").val());
  if (!isNaN(retryDelay)) config.retry_delay_ms = retryDelay;

  try {
    const res = await fetch(baseUrl + "/session/rabbitmq/config", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(config),
    });

    const data = await res.json();
    if (data.success) {
      showSuccess("RabbitMQ configuration saved successfully");
      // Show delete button since we now have a configuration
      $("#deleteRabbitMQConfig").show();
      $("#modalRabbitMQConfig").modal("hide");
    } else {
      showError(
        "Failed to save RabbitMQ configuration: " +
          (data.error || "Unknown error"),
      );
    }
  } catch (error) {
    showError("Error saving RabbitMQ configuration");
    console.error("Error:", error);
  }
}

async function testRabbitMQConnection() {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);

  // Show loading state
  $("#testRabbitMQConnection").addClass("loading disabled");

  try {
    const res = await fetch(baseUrl + "/session/rabbitmq/test", {
      method: "POST",
      headers: myHeaders,
    });

    const data = await res.json();
    if (data.success) {
      showSuccess("RabbitMQ connection test successful!");
    } else {
      showError(
        "RabbitMQ connection test failed: " + (data.error || "Unknown error"),
      );
    }
  } catch (error) {
    showError("Error testing RabbitMQ connection");
    console.error("Error:", error);
  } finally {
    $("#testRabbitMQConnection").removeClass("loading disabled");
  }
}

async function deleteRabbitMQConfig() {
  // Show confirmation dialog
  if (
    !confirm(
      "Are you sure you want to delete the RabbitMQ configuration? This action cannot be undone.",
    )
  ) {
    return;
  }

  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);

  // Show loading state
  $("#deleteRabbitMQConfig").addClass("loading disabled");

  try {
    const res = await fetch(baseUrl + "/session/rabbitmq/config", {
      method: "DELETE",
      headers: myHeaders,
    });

    const data = await res.json();
    if (data.success) {
      showSuccess("RabbitMQ configuration deleted successfully");

      // Clear all form fields
      $("#rabbitmqUrl").val("");
      $("#rabbitmqExchange").val("");
      $("#rabbitmqExchangeType").dropdown("set selected", "topic");
      $("#rabbitmqQueueType").dropdown("set selected", "classic");
      $("#rabbitmqDeliveryMode").dropdown("set selected", "2");
      $("#rabbitmqRoutingKey").val("");
      $("#rabbitmqQueue").val("");
      $("#rabbitmqDurable").prop("checked", true);
      $("#rabbitmqAutoDelete").prop("checked", false);
      $("#rabbitmqExclusive").prop("checked", false);
      $("#rabbitmqNoWait").prop("checked", false);

      $("#rabbitmqEvents").dropdown("clear");

      // Hide delete button
      $("#deleteRabbitMQConfig").hide();

      $("#modalRabbitMQConfig").modal("hide");
    } else {
      showError(
        "Failed to delete RabbitMQ configuration: " +
          (data.error || "Unknown error"),
      );
    }
  } catch (error) {
    showError("Error deleting RabbitMQ configuration");
    console.error("Error:", error);
  } finally {
    $("#deleteRabbitMQConfig").removeClass("loading disabled");
  }
}

// Skip Media Download Configuration Functions
async function loadSkipMediaConfig() {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);

  try {
    const res = await fetch(baseUrl + "/session/skipmedia/config", {
      method: "GET",
      headers: myHeaders,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        // Set user's skip media download setting - usar as chaves corretas
        const userSkipMedia = data.data.UserSkipMediaDownload === true;
        $("#skipMediaDownload").prop("checked", userSkipMedia);
        $("#skipMediaDownloadToggle").checkbox(
          userSkipMedia ? "set checked" : "set unchecked",
        );

        // Update global status display
        const globalSkipMedia = data.data.GlobalSkipMediaDownload === true;
        $("#globalSkipMediaStatus").text(
          globalSkipMedia ? "Enabled" : "Disabled",
        );

        // Show/hide warning messages based on current setting
        if (userSkipMedia) {
          $("#skipMediaWarning").show();
          $("#skipMediaBenefit").show();
        } else {
          $("#skipMediaWarning").hide();
          $("#skipMediaBenefit").hide();
        }
      } else {
        console.error("Failed to load skip media config:", data.error);
        $("#globalSkipMediaStatus").text("Error loading");
      }
    } else {
      console.error("Failed to load skip media config:", res.status);
      $("#globalSkipMediaStatus").text("Error loading");
    }
  } catch (error) {
    console.error("Error loading skip media config:", error);
    $("#globalSkipMediaStatus").text("Error loading");
  }
}

async function saveSkipMediaConfig() {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");

  const enabled = $("#skipMediaDownload").is(":checked");

  const config = {
    enabled: enabled,
  };

  try {
    const res = await fetch(baseUrl + "/session/skipmedia/config", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(config),
    });

    const data = await res.json();
    if (data.success) {
      showSuccess(
        `Skip media download ${enabled ? "enabled" : "disabled"} successfully`,
      );
      $("#modalSkipMediaConfig").modal("hide");
    } else {
      showError(
        "Failed to save skip media configuration: " +
          (data.error || "Unknown error"),
      );
    }
  } catch (error) {
    showError("Error saving skip media configuration");
    console.error("Error:", error);
  }
}

// Skip Groups Configuration Functions
async function loadSkipGroupsConfig() {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);

  try {
    const res = await fetch(baseUrl + "/session/skipgroups/config", {
      method: "GET",
      headers: myHeaders,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        // Set user's skip groups setting - usar a chave correta SkipGroups
        const userSkipGroups = data.data.SkipGroups === true;
        $("#skipGroups").prop("checked", userSkipGroups);
        $("#skipGroupsToggle").checkbox(
          userSkipGroups ? "set checked" : "set unchecked",
        );

        // Update status display
        $("#skipGroupsCurrentStatus").text(
          userSkipGroups ? "Enabled" : "Disabled",
        );

        // Show/hide warning and benefit messages
        if (userSkipGroups) {
          $("#skipGroupsWarning").show();
          $("#skipGroupsBenefit").show();
        } else {
          $("#skipGroupsWarning").hide();
          $("#skipGroupsBenefit").hide();
        }
      } else {
        console.error("Failed to load skip groups config:", data.error);
        $("#skipGroupsCurrentStatus").text("Error loading");
      }
    } else {
      console.error("Failed to load skip groups config:", res.status);
      $("#skipGroupsCurrentStatus").text("Error loading");
    }
  } catch (error) {
    console.error("Error loading skip groups config:", error);
    $("#skipGroupsCurrentStatus").text("Error loading");
  }
}

async function saveSkipGroupsConfig() {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");

  const enabled = $("#skipGroups").is(":checked");

  const config = {
    enabled: enabled,
  };

  try {
    const res = await fetch(baseUrl + "/session/skipgroups/config", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(config),
    });

    const data = await res.json();
    if (data.success) {
      showSuccess(
        `Skip groups processing ${enabled ? "enabled" : "disabled"} successfully`,
      );
      $("#modalSkipGroupsConfig").modal("hide");
    } else {
      showError(
        "Failed to save skip groups configuration: " +
          (data.error || "Unknown error"),
      );
    }
  } catch (error) {
    showError("Error saving skip groups configuration");
    console.error("Error:", error);
  }
}

// Skip Newsletters Configuration Functions
async function loadSkipNewslettersConfig() {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);

  try {
    const res = await fetch(baseUrl + "/session/skipnewsletters/config", {
      method: "GET",
      headers: myHeaders,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        // Set user's skip newsletters setting - usar a chave correta
        const userSkipNewsletters = data.data.SkipNewsletters === true;
        $("#skipNewsletters").prop("checked", userSkipNewsletters);
        $("#skipNewslettersToggle").checkbox(
          userSkipNewsletters ? "set checked" : "set unchecked",
        );

        // Update status display
        $("#skipNewslettersCurrentStatus").text(
          userSkipNewsletters ? "Enabled" : "Disabled",
        );

        // Show/hide warning and benefit messages
        if (userSkipNewsletters) {
          $("#skipNewslettersWarning").show();
          $("#skipNewslettersBenefit").show();
        } else {
          $("#skipNewslettersWarning").hide();
          $("#skipNewslettersBenefit").hide();
        }
      } else {
        console.error("Failed to load skip newsletters config:", data.error);
        $("#skipNewslettersCurrentStatus").text("Error loading");
      }
    } else {
      console.error("Failed to load skip newsletters config:", res.status);
      $("#skipNewslettersCurrentStatus").text("Error loading");
    }
  } catch (error) {
    console.error("Error loading skip newsletters config:", error);
    $("#skipNewslettersCurrentStatus").text("Error loading");
  }
}

async function saveSkipNewslettersConfig() {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");

  const enabled = $("#skipNewsletters").is(":checked");

  const config = {
    enabled: enabled,
  };

  try {
    const res = await fetch(baseUrl + "/session/skipnewsletters/config", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(config),
    });

    const data = await res.json();
    if (data.success) {
      showSuccess(
        `Skip newsletters processing ${enabled ? "enabled" : "disabled"} successfully`,
      );
      $("#modalSkipNewslettersConfig").modal("hide");
    } else {
      showError(
        "Failed to save skip newsletters configuration: " +
          (data.error || "Unknown error"),
      );
    }
  } catch (error) {
    showError("Error saving skip newsletters configuration");
    console.error("Error:", error);
  }
}

// Skip Broadcasts Configuration Functions
async function loadSkipBroadcastsConfig() {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);

  try {
    const res = await fetch(baseUrl + "/session/skipbroadcasts/config", {
      method: "GET",
      headers: myHeaders,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        // Set user's skip broadcasts setting - usar a chave correta
        const userSkipBroadcasts = data.data.SkipBroadcasts === true;
        $("#skipBroadcasts").prop("checked", userSkipBroadcasts);
        $("#skipBroadcastsToggle").checkbox(
          userSkipBroadcasts ? "set checked" : "set unchecked",
        );

        // Update status display
        $("#skipBroadcastsCurrentStatus").text(
          userSkipBroadcasts ? "Enabled" : "Disabled",
        );

        // Show/hide warning and benefit messages
        if (userSkipBroadcasts) {
          $("#skipBroadcastsWarning").show();
          $("#skipBroadcastsBenefit").show();
        } else {
          $("#skipBroadcastsWarning").hide();
          $("#skipBroadcastsBenefit").hide();
        }
      } else {
        console.error("Failed to load skip broadcasts config:", data.error);
        $("#skipBroadcastsCurrentStatus").text("Error loading");
      }
    } else {
      console.error("Failed to load skip broadcasts config:", res.status);
      $("#skipBroadcastsCurrentStatus").text("Error loading");
    }
  } catch (error) {
    console.error("Error loading skip broadcasts config:", error);
    $("#skipBroadcastsCurrentStatus").text("Error loading");
  }
}

async function saveSkipBroadcastsConfig() {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");

  const enabled = $("#skipBroadcasts").is(":checked");

  const config = {
    enabled: enabled,
  };

  try {
    const res = await fetch(baseUrl + "/session/skipbroadcasts/config", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(config),
    });

    const data = await res.json();
    if (data.success) {
      showSuccess(
        `Skip broadcasts processing ${enabled ? "enabled" : "disabled"} successfully`,
      );
      $("#modalSkipBroadcastsConfig").modal("hide");
    } else {
      showError(
        "Failed to save skip broadcasts configuration: " +
          (data.error || "Unknown error"),
      );
    }
  } catch (error) {
    showError("Error saving skip broadcasts configuration");
    console.error("Error:", error);
  }
}

//
// Skip Own Messages Configuration Functions
async function loadSkipOwnMessagesConfig() {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);

  try {
    const res = await fetch(baseUrl + "/session/skipownmessages/config", {
      method: "GET",
      headers: myHeaders,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        // Set user's skip own messages setting - usar a chave correta
        const userSkipOwnMessages = data.data.SkipOwnMessages === true;
        $("#skipOwnMessages").prop("checked", userSkipOwnMessages);
        $("#skipOwnMessagesToggle").checkbox(
          userSkipOwnMessages ? "set checked" : "set unchecked",
        );

        // Update status display
        $("#skipOwnMessagesCurrentStatus").text(
          userSkipOwnMessages ? "Enabled" : "Disabled",
        );

        // Show/hide warning and benefit messages
        if (userSkipOwnMessages) {
          $("#skipOwnMessagesWarning").show();
          $("#skipOwnMessagesBenefit").show();
        } else {
          $("#skipOwnMessagesWarning").hide();
          $("#skipOwnMessagesBenefit").hide();
        }
      } else {
        console.error("Failed to load skip own messages config:", data.error);
        $("#skipOwnMessagesCurrentStatus").text("Error loading");
      }
    } else {
      console.error("Failed to load skip own messages config:", res.status);
      $("#skipOwnMessagesCurrentStatus").text("Error loading");
    }
  } catch (error) {
    console.error("Error loading skip own messages config:", error);
    $("#skipOwnMessagesCurrentStatus").text("Error loading");
  }
}

async function saveSkipOwnMessagesConfig() {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");

  const enabled = $("#skipOwnMessages").is(":checked");

  const config = {
    enabled: enabled,
  };

  try {
    const res = await fetch(baseUrl + "/session/skipownmessages/config", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(config),
    });

    const data = await res.json();
    if (data.success) {
      showSuccess(
        `Skip own messages processing ${enabled ? "enabled" : "disabled"} successfully`,
      );
      $("#modalSkipOwnMessagesConfig").modal("hide");
    } else {
      showError(
        "Failed to save skip own messages configuration: " +
          (data.error || "Unknown error"),
      );
    }
  } catch (error) {
    showError("Error saving skip own messages configuration");
    console.error("Error:", error);
  }
}

// Skip Calls Configuration Functions
async function loadSkipCallsConfig() {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);

  try {
    const res = await fetch(baseUrl + "/session/skipcalls/config", {
      method: "GET",
      headers: myHeaders,
    });

    const data = await res.json();
    if (data.success) {
      const userSkipCalls = data.data.SkipCalls === true;
      const rejectMessage =
        data.data.RejectMessage || "Sorry, I cannot take calls at the moment.";
      const rejectType = data.data.RejectType || "busy";

      $("#skipCalls").prop("checked", userSkipCalls);
      $("#skipCallsToggle").checkbox(
        userSkipCalls ? "set checked" : "set unchecked",
      );
      $("#callRejectMessage").val(rejectMessage);
      $("#callRejectType").dropdown("set selected", rejectType);

      $("#skipCallsCurrentStatus").text(userSkipCalls ? "Enabled" : "Disabled");

      // Show/hide warnings and benefits
      if (userSkipCalls) {
        $("#skipCallsWarning").show();
        $("#skipCallsBenefit").show();
      } else {
        $("#skipCallsWarning").hide();
        $("#skipCallsBenefit").hide();
      }
    } else {
      $("#skipCallsCurrentStatus").text("Error loading");
      showError(
        "Failed to load skip calls configuration: " +
          (data.error || "Unknown error"),
      );
    }
  } catch (error) {
    $("#skipCallsCurrentStatus").text("Error loading");
    showError("Error loading skip calls configuration");
    console.error("Error:", error);
  }
}

async function saveSkipCallsConfig() {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");

  const enabled = $("#skipCalls").is(":checked");
  const rejectMessage =
    $("#callRejectMessage").val().trim() ||
    "Sorry, I cannot take calls at the moment.";
  const rejectType = $("#callRejectType").dropdown("get value") || "busy";

  const config = {
    enabled: enabled,
    reject_message: rejectMessage,
    reject_type: rejectType,
  };

  try {
    const res = await fetch(baseUrl + "/session/skipcalls/config", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(config),
    });

    const data = await res.json();
    if (data.success) {
      showSuccess(
        `Skip calls ${enabled ? "enabled" : "disabled"} successfully. ${enabled ? 'All incoming calls will be automatically rejected with message: "' + rejectMessage + '"' : "Incoming calls will be accepted normally."}`,
      );
      $("#modalSkipCallsConfig").modal("hide");
    } else {
      showError(
        "Failed to save skip calls configuration: " +
          (data.error || "Unknown error"),
      );
    }
  } catch (error) {
    showError("Error saving skip calls configuration");
    console.error("Error:", error);
  }
}

// Utility function to safely handle dropdown values
function safeGetDropdownValues(dropdownValue) {
  let result = [];
  try {
    if (dropdownValue) {
      if (Array.isArray(dropdownValue)) {
        result = dropdownValue.filter(
          (v) => v && typeof v === "string" && v.trim() !== "",
        );
      } else if (typeof dropdownValue === "string") {
        result = dropdownValue.split(",").filter((v) => v && v.trim() !== "");
      } else if (dropdownValue !== null && dropdownValue !== undefined) {
        // Handle any other type by converting to string first
        const strValue = String(dropdownValue).trim();
        if (strValue) {
          result = [strValue];
        }
      }
    }
  } catch (error) {
    console.error(
      "Error processing dropdown values:",
      error,
      "Input:",
      dropdownValue,
    );
    result = [];
  }
  return result;
}

// Configuration card event listeners
$("#skipGroupsConfig").on("click", function () {
  loadSkipGroupsConfig();
  $("#modalSkipGroupsConfig").modal("show");
});

$("#skipNewslettersConfig").on("click", function () {
  loadSkipNewslettersConfig();
  $("#modalSkipNewslettersConfig").modal("show");
});

$("#skipBroadcastsConfig").on("click", function () {
  loadSkipBroadcastsConfig();
  $("#modalSkipBroadcastsConfig").modal("show");
});

$("#skipOwnMessagesConfig").on("click", function () {
  loadSkipOwnMessagesConfig();
  $("#modalSkipOwnMessagesConfig").modal("show");
});

$("#skipCallsConfig").on("click", function () {
  loadSkipCallsConfig();
  $("#modalSkipCallsConfig").modal("show");
});

// Save configuration buttons
$("#saveSkipGroupsConfig").on("click", function () {
  saveSkipGroupsConfig();
});

$("#saveSkipNewslettersConfig").on("click", function () {
  saveSkipNewslettersConfig();
});

$("#saveSkipBroadcastsConfig").on("click", function () {
  saveSkipBroadcastsConfig();
});

$("#saveSkipOwnMessagesConfig").on("click", function () {
  saveSkipOwnMessagesConfig();
});

$("#saveSkipCallsConfig").on("click", function () {
  saveSkipCallsConfig();
});

// Status functions
function initializeStatusModals() {
  // Text Status Events
  $("#sendTextStatus").on("click", function () {
    $("#modalSendTextStatus").modal("show");
    initializeTextStatusPreview();
  });

  // Image Status Events
  $("#sendImageStatus").on("click", function () {
    $("#modalSendImageStatus").modal("show");
  });

  // Video Status Events
  $("#sendVideoStatus").on("click", function () {
    $("#modalSendVideoStatus").modal("show");
  });

  // Text Status Modal Events
  $("#textStatusMessage").on("input", updateTextStatusPreview);
  $("#backgroundColor, #backgroundColorText").on(
    "input",
    updateTextStatusColors,
  );
  $("#textColor, #textColorText").on("input", updateTextStatusColors);
  $("#fontSelect").on("change", updateTextStatusPreview);

  $("#resetBgColor").on("click", function () {
    $("#backgroundColor").val("#25D366");
    $("#backgroundColorText").val("#25D366");
    updateTextStatusColors();
  });

  $("#resetTextColor").on("click", function () {
    $("#textColor").val("#FFFFFF");
    $("#textColorText").val("#FFFFFF");
    updateTextStatusColors();
  });

  $("#sendTextStatusBtn").on("click", sendTextStatus);

  // Image Status Modal Events
  $("#selectImageFileBtn").on("click", function () {
    $("#imageStatusFile").click();
  });

  $("#useImageUrlBtn").on("click", function () {
    $("#imageUrlField").toggle();
  });

  $("#imageStatusFile").on("change", handleImageStatusFile);
  $("#imageStatusUrl").on("input", handleImageStatusUrl);
  $("#imageStatusCaption").on("input", updateImageCaptionCount);
  $("#sendImageStatusBtn").on("click", sendImageStatus);

  // Video Status Modal Events
  $("#selectVideoFileBtn").on("click", function () {
    $("#videoStatusFile").click();
  });

  $("#useVideoUrlBtn").on("click", function () {
    $("#videoUrlField").toggle();
  });

  $("#videoStatusFile").on("change", handleVideoStatusFile);
  $("#videoStatusUrl").on("input", handleVideoStatusUrl);
  $("#videoStatusCaption").on("input", updateVideoCaptionCount);
  $("#sendVideoStatusBtn").on("click", sendVideoStatus);
}

function initializeTextStatusPreview() {
  $("#textStatusMessage").val("");
  $("#backgroundColor").val("#25D366");
  $("#backgroundColorText").val("#25D366");
  $("#textColor").val("#FFFFFF");
  $("#textColorText").val("#FFFFFF");
  $("#fontSelect").val("");
  updateTextStatusPreview();
}

function updateTextStatusPreview() {
  const message =
    $("#textStatusMessage").val() || "Sua mensagem aparecerá aqui...";
  const charCount = $("#textStatusMessage").val().length;
  const bgColor = $("#backgroundColor").val() || "#25D366";
  const textColor = $("#textColor").val() || "#FFFFFF";
  const font = $("#fontSelect").val();

  $("#charCount").text(charCount);
  $("#statusPreviewText").text(message);

  let fontFamily = "Arial, sans-serif";
  switch (font) {
    case "BRYNDAN_WRITE":
      fontFamily = "cursive";
      break;
    case "BEBASNEUE_REGULAR":
      fontFamily = "Arial Black, sans-serif";
      break;
    case "OSWALD_HEAVY":
      fontFamily = "Impact, sans-serif";
      break;
    case "DAMION_REGULAR":
      fontFamily = "cursive";
      break;
    case "COURIER_PRIME_BOLD":
      fontFamily = "Courier New, monospace";
      break;
  }

  $("#statusPreviewContent").css({
    "background-color": bgColor,
    color: textColor,
    "font-family": fontFamily,
    "font-weight": font.includes("BOLD") ? "bold" : "normal",
  });
}

function updateTextStatusColors() {
  const bgColor = $("#backgroundColor").val();
  const textColor = $("#textColor").val();

  $("#backgroundColorText").val(bgColor);
  $("#textColorText").val(textColor);

  updateTextStatusPreview();
}

// Convert hex color to ARGB decimal format
function hexToARGB(hex, alpha = 255) {
  // Remove # if present
  hex = hex.replace("#", "");

  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Convert to ARGB decimal (Alpha, Red, Green, Blue)
  return (alpha << 24) | (r << 16) | (g << 8) | b;
}

// Convert font name to font number (0-10)
function getFontNumber(fontName) {
  const fontMap = {
    BRYNDAN_WRITE: 1,
    BEBASNEUE_REGULAR: 2,
    OSWALD_HEAVY: 3,
    DAMION_REGULAR: 4,
    MORNINGBREEZE_REGULAR: 5,
    CALISTOGA_REGULAR: 6,
    EXO_BOLD: 7,
    COURIER_PRIME_BOLD: 8,
  };
  return fontMap[fontName] || 0; // Default font
}

async function sendTextStatus() {
  const token = getLocalStorageItem("token");
  const text = $("#textStatusMessage").val().trim();

  if (!text) {
    showError("Please enter a message");
    return;
  }

  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");

  // Build request body following API pattern
  const statusData = {
    text: text,
  };

  const backgroundColor = $("#backgroundColor").val();
  const textColor = $("#textColor").val();
  const font = $("#fontSelect").val();

  // Convert hex colors to ARGB decimal format as expected by API
  if (backgroundColor && backgroundColor !== "#25D366") {
    statusData.background_color = hexToARGB(backgroundColor).toString();
  }

  if (textColor && textColor !== "#FFFFFF") {
    statusData.text_color = hexToARGB(textColor).toString();
  }

  // Convert font name to number as expected by API
  if (font) {
    statusData.font = getFontNumber(font);
  }

  try {
    $("#sendTextStatusBtn").addClass("loading");

    const res = await fetch(baseUrl + "/status/send/text", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(statusData),
    });

    const data = await res.json();

    if (data.success) {
      showSuccess("Text status sent successfully!");
      $("#modalSendTextStatus").modal("hide");
      $("#textStatusForm")[0].reset();
      initializeTextStatusPreview();
    } else {
      showError("Error sending status: " + (data.error || "Unknown error"));
    }
  } catch (error) {
    showError("Error sending status: " + error.message);
    console.error("Error:", error);
  } finally {
    $("#sendTextStatusBtn").removeClass("loading");
  }
}

function handleImageStatusFile(event) {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 16 * 1024 * 1024) {
      // 16MB
      showError("File too large. Maximum size: 16MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      showImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  }
}

function handleImageStatusUrl() {
  const url = $("#imageStatusUrl").val().trim();
  if (url) {
    showImagePreview(url);
  } else {
    hideImagePreview();
  }
}

function showImagePreview(src) {
  $("#imageStatusPreview").attr("src", src);
  $("#imagePreviewContainer").show();
  updateImageCaptionPreview();
}

function hideImagePreview() {
  $("#imagePreviewContainer").hide();
}

function updateImageCaptionCount() {
  const count = $("#imageStatusCaption").val().length;
  $("#imageCaptionCount").text(count);
  updateImageCaptionPreview();
}

function updateImageCaptionPreview() {
  const caption = $("#imageStatusCaption").val().trim();
  if (caption) {
    $("#imageCaptionText").text(caption);
    $("#imageCaptionPreview").show();
  } else {
    $("#imageCaptionPreview").hide();
  }
}

async function sendImageStatus() {
  const token = getLocalStorageItem("token");
  const file = $("#imageStatusFile")[0].files[0];
  const url = $("#imageStatusUrl").val().trim();
  const caption = $("#imageStatusCaption").val().trim();

  if (!file && !url) {
    showError("Please select an image or enter a URL");
    return;
  }

  try {
    $("#sendImageStatusBtn").addClass("loading");

    // Build request body following API pattern (always JSON)
    const requestBody = {};

    if (caption) {
      requestBody.caption = caption;
    }

    if (file) {
      // Convert file to base64 for JSON API
      const reader = new FileReader();
      reader.onload = async function (e) {
        requestBody.image = e.target.result; // Base64 data URL
        await submitImageStatus(requestBody, token);
      };
      reader.readAsDataURL(file);
    } else if (url) {
      // Use URL directly
      requestBody.image = url;
      await submitImageStatus(requestBody, token);
    }
  } catch (error) {
    showError("Error sending status: " + error.message);
    console.error("Error:", error);
    $("#sendImageStatusBtn").removeClass("loading");
  }
}

async function submitImageStatus(requestBody, token) {
  try {
    const myHeaders = new Headers();
    myHeaders.append("token", token);
    myHeaders.append("Content-Type", "application/json");

    const res = await fetch(baseUrl + "/status/send/image", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(requestBody),
    });

    const statusData = await res.json();

    if (statusData.success) {
      showSuccess("Image status sent successfully!");
      $("#modalSendImageStatus").modal("hide");
      $("#imageStatusForm")[0].reset();
      hideImagePreview();
    } else {
      showError(
        "Error sending status: " + (statusData.error || "Unknown error"),
      );
    }
  } catch (error) {
    showError("Error sending status: " + error.message);
    console.error("Error:", error);
  } finally {
    $("#sendImageStatusBtn").removeClass("loading");
  }
}

function handleVideoStatusFile(event) {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 64 * 1024 * 1024) {
      // 64MB
      showError("File too large. Maximum size: 64MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      showVideoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  }
}

function handleVideoStatusUrl() {
  const url = $("#videoStatusUrl").val().trim();
  if (url) {
    showVideoPreview(url);
  } else {
    hideVideoPreview();
  }
}

function showVideoPreview(src) {
  $("#videoStatusSource").attr("src", src);
  $("#videoStatusPreview")[0].load();
  $("#videoPreviewContainer").show();
  updateVideoCaptionPreview();
}

function hideVideoPreview() {
  $("#videoPreviewContainer").hide();
}

function updateVideoCaptionCount() {
  const count = $("#videoStatusCaption").val().length;
  $("#videoCaptionCount").text(count);
  updateVideoCaptionPreview();
}

function updateVideoCaptionPreview() {
  const caption = $("#videoStatusCaption").val().trim();
  if (caption) {
    $("#videoCaptionText").text(caption);
    $("#videoCaptionPreview").show();
  } else {
    $("#videoCaptionPreview").hide();
  }
}

async function sendVideoStatus() {
  const token = getLocalStorageItem("token");
  const file = $("#videoStatusFile")[0].files[0];
  const url = $("#videoStatusUrl").val().trim();
  const caption = $("#videoStatusCaption").val().trim();

  if (!file && !url) {
    showError("Please select a video or enter a URL");
    return;
  }

  try {
    $("#sendVideoStatusBtn").addClass("loading");

    // Build request body following API pattern (always JSON)
    const requestBody = {};

    if (caption) {
      requestBody.caption = caption;
    }

    if (file) {
      // Convert file to base64 for JSON API
      const reader = new FileReader();
      reader.onload = async function (e) {
        requestBody.video = e.target.result; // Base64 data URL
        await submitVideoStatus(requestBody, token);
      };
      reader.readAsDataURL(file);
    } else if (url) {
      // Use URL directly
      requestBody.video = url;
      await submitVideoStatus(requestBody, token);
    }
  } catch (error) {
    showError("Error sending status: " + error.message);
    console.error("Error:", error);
    $("#sendVideoStatusBtn").removeClass("loading");
  }
}

async function submitVideoStatus(requestBody, token) {
  try {
    const myHeaders = new Headers();
    myHeaders.append("token", token);
    myHeaders.append("Content-Type", "application/json");

    const res = await fetch(baseUrl + "/status/send/video", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(requestBody),
    });

    const statusData = await res.json();

    if (statusData.success) {
      showSuccess("Video status sent successfully!");
      $("#modalSendVideoStatus").modal("hide");
      $("#videoStatusForm")[0].reset();
      hideVideoPreview();
    } else {
      showError(
        "Error sending status: " + (statusData.error || "Unknown error"),
      );
    }
  } catch (error) {
    showError("Error sending status: " + error.message);
    console.error("Error:", error);
  } finally {
    $("#sendVideoStatusBtn").removeClass("loading");
  }
}

// Newsletter functions
function initializeNewsletterModals() {
  // Newsletter Modal Events
  $("#listNewsletter").on("click", function () {
    $("#modalListNewsletters").modal("show");
    loadNewsletters();
  });

  $("#createNewsletter").on("click", function () {
    $("#modalCreateNewsletter").modal("show");
    initializeNewsletterPreview();
  });

  $("#newsletterInfo").on("click", function () {
    $("#modalNewsletterInfo").modal("show");
  });

  // Newsletter form events
  $("#newsletterName").on("input", updateNewsletterNameCount);
  $("#newsletterDescription").on("input", updateNewsletterDescriptionCount);
  $("#selectNewsletterPictureBtn").on("click", function () {
    $("#newsletterPictureFile").click();
  });
  $("#useNewsletterPictureUrlBtn").on("click", function () {
    $("#newsletterPictureUrlField").toggle();
  });
  $("#newsletterPictureFile").on("change", handleNewsletterPictureFile);
  $("#newsletterPictureUrl").on("input", handleNewsletterPictureUrl);
  $("#createNewsletterBtn").on("click", createNewsletter);
  $("#getNewsletterInfoBtn").on("click", getNewsletterInfo);
  $("#refreshNewsletters").on("click", loadNewsletters);
  $("#createFirstNewsletter").on("click", function () {
    $("#modalListNewsletters").modal("hide");
    $("#modalCreateNewsletter").modal("show");
  });
}

function initializeNewsletterPreview() {
  $("#newsletterName").val("");
  $("#newsletterDescription").val("");
  $("#newsletterPictureFile").val("");
  $("#newsletterPictureUrl").val("");
  $("#newsletterPictureUrlField").hide();
  $("#newsletterPicturePreviewContainer").hide();
  updateNewsletterNameCount();
  updateNewsletterDescriptionCount();
}

function updateNewsletterNameCount() {
  const count = $("#newsletterName").val().length;
  $("#nameCount").text(count);
}

function updateNewsletterDescriptionCount() {
  const count = $("#newsletterDescription").val().length;
  $("#descriptionCount").text(count);
}

function handleNewsletterPictureFile(event) {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      // 10MB
      showError("File too large. Maximum size: 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      showNewsletterPicturePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  }
}

function handleNewsletterPictureUrl() {
  const url = $("#newsletterPictureUrl").val().trim();
  if (url) {
    showNewsletterPicturePreview(url);
  } else {
    hideNewsletterPicturePreview();
  }
}

function showNewsletterPicturePreview(src) {
  $("#newsletterPicturePreview").attr("src", src);
  $("#newsletterPicturePreviewContainer").show();
}

function hideNewsletterPicturePreview() {
  $("#newsletterPicturePreviewContainer").hide();
}

async function createNewsletter() {
  const token = getLocalStorageItem("token");
  const name = $("#newsletterName").val().trim();
  const description = $("#newsletterDescription").val().trim();
  const file = $("#newsletterPictureFile")[0].files[0];
  const url = $("#newsletterPictureUrl").val().trim();

  if (!name) {
    showError("Newsletter name is required");
    return;
  }

  try {
    $("#createNewsletterBtn").addClass("loading");

    // Build request body following API pattern
    const requestBody = {
      name: name,
    };

    if (description) {
      requestBody.description = description;
    }

    // Handle picture upload following the API pattern
    if (file) {
      const reader = new FileReader();
      reader.onload = async function (e) {
        requestBody.picture = e.target.result;
        await submitCreateNewsletter(requestBody, token);
      };
      reader.readAsDataURL(file);
    } else if (url) {
      requestBody.picture = url;
      await submitCreateNewsletter(requestBody, token);
    } else {
      await submitCreateNewsletter(requestBody, token);
    }
  } catch (error) {
    showError("Error creating newsletter: " + error.message);
    console.error("Error:", error);
    $("#createNewsletterBtn").removeClass("loading");
  }
}

async function submitCreateNewsletter(requestBody, token) {
  try {
    const myHeaders = new Headers();
    myHeaders.append("token", token);
    myHeaders.append("Content-Type", "application/json");

    const res = await fetch(baseUrl + "/newsletter/create", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();

    if (data.success) {
      showSuccess("Newsletter created successfully!");
      $("#modalCreateNewsletter").modal("hide");
      $("#createNewsletterForm")[0].reset();
      hideNewsletterPicturePreview();
    } else {
      showError(
        "Error creating newsletter: " + (data.message || "Unknown error"),
      );
    }
  } catch (error) {
    showError("Error creating newsletter: " + error.message);
    console.error("Error:", error);
  } finally {
    $("#createNewsletterBtn").removeClass("loading");
  }
}

async function getNewsletterInfo() {
  const token = getLocalStorageItem("token");
  const newsletterId = $("#newsletterInfoId").val().trim();

  if (!newsletterId) {
    showError("Newsletter ID is required");
    return;
  }

  try {
    $("#getNewsletterInfoBtn").addClass("loading");

    const myHeaders = new Headers();
    myHeaders.append("token", token);
    myHeaders.append("Content-Type", "application/json");

    // Send as POST with JSON body to match the handler expectation
    const res = await fetch(baseUrl + "/newsletter/info", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify({ newsletter_id: newsletterId }),
    });

    const data = await res.json();

    if (data.code === 200) {
      displayNewsletterInfo(data);
      $("#newsletterInfoResult").show();
    } else {
      showError(
        "Error getting newsletter info: " +
          (data.error || "Newsletter not found"),
      );
    }
  } catch (error) {
    showError("Error getting newsletter info: " + error.message);
    console.error("Error:", error);
  } finally {
    $("#getNewsletterInfoBtn").removeClass("loading");
  }
}

function displayNewsletterInfo(data) {
  const container = $("#newsletterDetailsList");
  container.empty();

  const info = [
    { label: "JID", value: data.jid || "N/A" },
    { label: "Name", value: data.name || "N/A" },
    { label: "Description", value: data.description || "No description" },
    { label: "Subscribers", value: data.subscribers || "0" },
    { label: "Invite Code", value: data.invite_code || "N/A" },
    { label: "Role", value: data.role || "N/A" },
    { label: "Muted", value: data.muted ? "Yes" : "No" },
  ];

  info.forEach((item) => {
    container.append(`
      <div class="item">
        <div class="content">
          <div class="header">${item.label}</div>
          <div class="description">${item.value}</div>
        </div>
      </div>
    `);
  });
}

async function loadNewsletters() {
  const token = getLocalStorageItem("token");

  try {
    $("#newslettersLoading").show();
    $("#newslettersListContainer").hide();
    $("#noNewslettersMessage").addClass("hidden");

    const myHeaders = new Headers();
    myHeaders.append("token", token);

    const res = await fetch(baseUrl + "/newsletter/list", {
      method: "GET",
      headers: myHeaders,
    });

    const data = await res.json();

    if (data.code === 200 && data.newsletter) {
      displayNewsletters(data.newsletter);
    } else {
      $("#noNewslettersMessage").removeClass("hidden");
    }
  } catch (error) {
    showError("Error loading newsletters: " + error.message);
    console.error("Error:", error);
    $("#noNewslettersMessage").removeClass("hidden");
  } finally {
    $("#newslettersLoading").hide();
  }
}

function displayNewsletters(newsletters) {
  const container = $("#newslettersListContainer");
  container.empty();

  if (newsletters.length === 0) {
    $("#noNewslettersMessage").removeClass("hidden");
    return;
  }

  newsletters.forEach((newsletter) => {
    const item = `
      <div class="item">
        <div class="content">
          <div class="header">${newsletter.Name || "Unknown Newsletter"}</div>
          <div class="meta">
            <span><i class="users icon"></i> ${newsletter.SubscriberCount || 0} subscribers</span>
            <span><i class="id card icon"></i> ${newsletter.ID || "No ID"}</span>
          </div>
          <div class="description">${newsletter.Description || "No description available"}</div>
        </div>
      </div>
    `;
    container.append(item);
  });

  $("#newslettersListContainer").show();
}

/**
 * Toggle token visibility for a specific instance
 * @param {string} instanceId - The instance ID
 */
function toggleTokenVisibility(instanceId) {
  const tokenInput = document.getElementById(`token-${instanceId}`);
  const eyeIcon = document.getElementById(`eye-icon-${instanceId}`);

  if (!tokenInput || !eyeIcon) {
    console.error(`Token elements not found for instance: ${instanceId}`);
    return;
  }

  if (tokenInput.type === "password") {
    tokenInput.type = "text";
    eyeIcon.className = "eye slash icon";
    eyeIcon.title = "Hide Token";
  } else {
    tokenInput.type = "password";
    eyeIcon.className = "eye icon";
    eyeIcon.title = "Show Token";
  }
}

/**
 * Copy token to clipboard for a specific instance
 * @param {string} instanceId - The instance ID
 */
function copyToken(instanceId) {
  const tokenInput = document.getElementById(`token-${instanceId}`);

  if (!tokenInput) {
    console.error(`Token input not found for instance: ${instanceId}`);
    showTokenError("Error: Token not found");
    return;
  }

  // Create a temporary textarea element to copy the token
  const tempTextArea = document.createElement("textarea");
  tempTextArea.value = tokenInput.value;
  tempTextArea.style.position = "fixed";
  tempTextArea.style.left = "-999999px";
  tempTextArea.style.top = "-999999px";
  document.body.appendChild(tempTextArea);
  tempTextArea.select();
  tempTextArea.setSelectionRange(0, 99999); // For mobile devices

  try {
    document.execCommand("copy");
    showTokenSuccess("Token copied to clipboard!");
  } catch (err) {
    // Fallback for browsers that don't support execCommand
    try {
      navigator.clipboard
        .writeText(tokenInput.value)
        .then(() => {
          showTokenSuccess("Token copied to clipboard!");
        })
        .catch(() => {
          showTokenError("Error copying token. Try again.");
        });
    } catch (clipboardErr) {
      showTokenError("Error copying token. Try again.");
    }
  }

  document.body.removeChild(tempTextArea);
}

/**
 * Show success message for token operations
 * @param {string} message - Success message to display
 */
function showTokenSuccess(message) {
  $("body").toast({
    class: "success",
    message: message,
    position: "top right",
    showProgress: "bottom",
    displayTime: 3000,
  });
}

/**
 * Show error message for token operations
 * @param {string} message - Error message to display
 */
function showTokenError(message) {
  $("body").toast({
    class: "error",
    message: message,
    position: "top right",
    showProgress: "bottom",
    displayTime: 3000,
  });
}

// Display RabbitMQ queue statistics
function displayRabbitMQStats(stats) {
  if (!stats) return;

  // Create statistics display HTML
  let statsHtml =
    '<div class="ui info message"><div class="header">📊 Estatísticas das Filas RabbitMQ</div>';

  if (stats.dynamicQueues) {
    statsHtml +=
      "<p><strong>🚀 Filas Dinâmicas:</strong> Ativo (criação automática por evento)</p>";
    statsHtml += `<p><strong>📝 Filas Criadas:</strong> ${stats.createdQueues}</p>`;

    if (stats.queueNames && stats.queueNames.length > 0) {
      statsHtml += "<p><strong>📋 Filas Ativas:</strong></p><ul>";
      stats.queueNames.forEach((queueName) => {
        statsHtml += `<li><code>${queueName}</code></li>`;
      });
      statsHtml += "</ul>";
    }
  } else {
    statsHtml +=
      "<p><strong>📁 Fila Estática:</strong> " +
      (stats.staticQueue || "Não configurada") +
      "</p>";
  }

  statsHtml += `<p><strong>🔄 Exchange:</strong> ${stats.exchangeName || "Não configurada"}</p>`;
  statsHtml += `<p><strong>🔑 Routing Key Pattern:</strong> ${stats.routingKeyPattern || "Não configurada"}</p>`;
  statsHtml += "</div>";

  // Display in the RabbitMQ modal
  $("#rabbitmqStatsContainer").html(statsHtml);
}

// Check User functionality
function doCheckUser() {
  const input = $("#checkUserInput").val().trim();
  if (!input) {
    showError("Please enter at least one phone number");
    return;
  }

  const phones = input
    .split("\n")
    .map((phone) => phone.trim())
    .filter((phone) => phone);
  if (phones.length === 0) {
    showError("Please enter valid phone numbers");
    return;
  }

  checkUser(phones)
    .then((data) => {
      document.getElementById("checkUserResult").classList.remove("hidden");
      // Verifica a estrutura correta da resposta da API - agora usa 'users' com 'u' minúsculo
      const users =
        data && data.data && data.data.users
          ? data.data.users
          : data && data.data && data.data.Users
            ? data.data.Users
            : data && data.Users
              ? data.Users
              : null;

      if (
        users &&
        (Array.isArray(users)
          ? users.length > 0
          : Object.keys(users).length > 0)
      ) {
        displayCheckUserResults(users);
        showSuccess("Users checked successfully");
      } else {
        document.getElementById("checkUserResult").innerHTML =
          '<div class="ui warning message">No valid results found</div>';
      }
    })
    .catch((error) => {
      console.error("Error checking users:", error);
      document.getElementById("checkUserResult").classList.remove("hidden");
      document.getElementById("checkUserResult").innerHTML =
        '<div class="ui negative message">Error checking users. Please try again.</div>';
    });
}

async function checkUser(phones) {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");

  try {
    const response = await fetch(baseUrl + "/user/check", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify({ Phone: phones }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to check users");
    }

    return data;
  } catch (error) {
    console.error("Error in checkUser function:", error);
    throw error;
  }
}

function displayCheckUserResults(users) {
  const container = $("#checkUserResult");
  container.html("");

  let resultsHtml = `
    <div class="ui segment">
      <h4 class="ui header">
        <i class="check circle icon"></i>
        WhatsApp User Check Results
      </h4>
      <div class="ui relaxed divided list">`;

  // Suporte para ambas as estruturas de dados: array ou object
  if (Array.isArray(users)) {
    // Estrutura antiga - array de usuários
    users.forEach((user) => {
      const statusIcon = user.IsInWhatsapp ? "check green" : "times red";
      const statusText = user.IsInWhatsapp ? "On WhatsApp" : "Not on WhatsApp";
      const statusColor = user.IsInWhatsapp ? "green" : "red";

      resultsHtml += `
        <div class="item">
          <i class="${statusIcon} icon"></i>
          <div class="content">
            <div class="header">${user.Query}</div>
            <div class="description">
              <div class="ui ${statusColor} label">
                <i class="${statusIcon} icon"></i>
                ${statusText}
              </div>
              ${user.JID ? `<div class="ui small label"><i class="id card icon"></i> ${user.JID}</div>` : ""}
              ${user.VerifiedName ? `<div class="ui blue label"><i class="verified icon"></i> ${user.VerifiedName}</div>` : ""}
            </div>
          </div>
        </div>`;
    });
  } else {
    // Nova estrutura - objeto com JIDs como chaves
    Object.entries(users).forEach(([jid, userInfo]) => {
      const isOnWhatsApp = userInfo && Object.keys(userInfo).length > 0;
      const statusIcon = isOnWhatsApp ? "check green" : "times red";
      const statusText = isOnWhatsApp ? "On WhatsApp" : "Not on WhatsApp";
      const statusColor = isOnWhatsApp ? "green" : "red";

      // Extrai o número do telefone do JID
      const phoneNumber = jid.split("@")[0];

      resultsHtml += `
        <div class="item">
          <i class="${statusIcon} icon"></i>
          <div class="content">
            <div class="header">${phoneNumber}</div>
            <div class="description">
              <div class="ui ${statusColor} label">
                <i class="${statusIcon} icon"></i>
                ${statusText}
              </div>
              ${jid ? `<div class="ui small label"><i class="id card icon"></i> ${jid}</div>` : ""}
              ${userInfo.verified_name ? `<div class="ui blue label"><i class="verified icon"></i> ${userInfo.verified_name}</div>` : ""}
              ${userInfo.is_business_account ? `<div class="ui purple label"><i class="building icon"></i> Business</div>` : ""}
              ${userInfo.device_count ? `<div class="ui teal label"><i class="mobile alternate icon"></i> ${userInfo.device_count} device${userInfo.device_count > 1 ? "s" : ""}</div>` : ""}
            </div>
          </div>
        </div>`;
    });
  }

  resultsHtml += `</div></div>`;
  container.html(resultsHtml);
}

// Privacy Settings functionality
async function loadPrivacySettings() {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);

  try {
    $("#loadPrivacySettingsBtn").addClass("loading");
    document.getElementById("privacySettingsResult").classList.remove("hidden");

    const response = await fetch(baseUrl + "/user/privacy/settings", {
      method: "GET",
      headers: myHeaders,
    });

    const data = await response.json();

    if (response.ok && data.success && data.data) {
      displayPrivacySettings(data.data);
      showSuccess("Privacy settings loaded successfully");
    } else {
      document.getElementById("privacySettingsResult").innerHTML =
        `<div class="ui negative message">Failed to load privacy settings: ${data.error || "Unknown error"}</div>`;
      showError("Failed to load privacy settings");
    }
  } catch (error) {
    console.error("Error loading privacy settings:", error);
    document.getElementById("privacySettingsResult").innerHTML =
      '<div class="ui negative message">Error loading privacy settings. Please try again.</div>';
    showError("Error loading privacy settings");
  } finally {
    $("#loadPrivacySettingsBtn").removeClass("loading");
  }
}

function displayPrivacySettings(settings) {
  const container = $("#privacySettingsResult");

  let settingsHtml = `
    <div class="ui segment">
      <h4 class="ui header">
        <i class="privacy icon"></i>
        Your Privacy Settings
      </h4>
      <div class="ui relaxed divided list">`;

  const privacyItems = [
    { label: "Group Add", value: settings.group_add, icon: "users" },
    { label: "Last Seen", value: settings.last_seen, icon: "clock" },
    { label: "Status", value: settings.status, icon: "comment" },
    { label: "Profile Photo", value: settings.profile, icon: "image" },
    {
      label: "Read Receipts",
      value: settings.read_receipts,
      icon: "check double",
    },
    { label: "Online Status", value: settings.online, icon: "circle" },
    { label: "Call Add", value: settings.call_add, icon: "phone" },
  ];

  privacyItems.forEach((item) => {
    let valueColor = "grey";
    let valueText = item.value || "Not set";

    switch (item.value) {
      case "all":
        valueColor = "green";
        valueText = "Everyone";
        break;
      case "contacts":
        valueColor = "blue";
        valueText = "My Contacts";
        break;
      case "contact_blacklist":
        valueColor = "orange";
        valueText = "My Contacts Except...";
        break;
      case "none":
        valueColor = "red";
        valueText = "Nobody";
        break;
    }

    settingsHtml += `
      <div class="item">
        <i class="${item.icon} icon"></i>
        <div class="content">
          <div class="header">${item.label}</div>
          <div class="description">
            <div class="ui ${valueColor} label">${valueText}</div>
          </div>
        </div>
      </div>`;
  });

  settingsHtml += `</div></div>`;
  container.html(settingsHtml);
}

// Change Push Name functionality
function doChangePushName() {
  const newName = $("#newPushNameInput").val().trim();
  if (!newName) {
    showError("Please enter a new push name");
    return;
  }

  if (newName.length > 25) {
    showError("Push name cannot exceed 25 characters");
    return;
  }

  changePushName(newName)
    .then((data) => {
      document
        .getElementById("changePushNameResult")
        .classList.remove("hidden");
      if (data && data.success) {
        document.getElementById("changePushNameResult").innerHTML =
          `<div class="ui positive message">
          <div class="header">Success!</div>
          <p>Your push name has been updated to: <strong>${newName}</strong></p>
        </div>`;
        showSuccess("Push name updated successfully");
        $("#newPushNameInput").val("");
      } else {
        document.getElementById("changePushNameResult").innerHTML =
          `<div class="ui negative message">Failed to update push name: ${data.error || "Unknown error"}</div>`;
        showError("Failed to update push name");
      }
    })
    .catch((error) => {
      console.error("Error changing push name:", error);
      document
        .getElementById("changePushNameResult")
        .classList.remove("hidden");
      document.getElementById("changePushNameResult").innerHTML =
        '<div class="ui negative message">Error updating push name. Please try again.</div>';
      showError("Error updating push name");
    });
}

async function changePushName(pushName) {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");

  try {
    const response = await fetch(baseUrl + "/user/pushname", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify({ push_name: pushName }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to change push name");
    }

    return data;
  } catch (error) {
    console.error("Error in changePushName function:", error);
    throw error;
  }
}

// My Status functionality
async function loadCurrentStatus() {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);

  try {
    $("#loadCurrentStatusBtn").addClass("loading");

    const response = await fetch(baseUrl + "/user/status", {
      method: "GET",
      headers: myHeaders,
    });

    const data = await response.json();

    if (response.ok && data) {
      $("#currentStatusDisplay").val(data.status || "No status set");
      showSuccess("Current status loaded");
    } else {
      $("#currentStatusDisplay").val("Error loading status");
      showError("Failed to load current status");
    }
  } catch (error) {
    console.error("Error loading current status:", error);
    $("#currentStatusDisplay").val("Error loading status");
    showError("Error loading current status");
  } finally {
    $("#loadCurrentStatusBtn").removeClass("loading");
  }
}

function updateStatusCharCount() {
  const count = $("#newStatusInput").val().length;
  $("#statusCharCount").text(count);
}

function doSetMyStatus() {
  const newStatus = $("#newStatusInput").val().trim();
  if (!newStatus) {
    showError("Please enter a status message");
    return;
  }

  if (newStatus.length > 139) {
    showError("Status message cannot exceed 139 characters");
    return;
  }

  setMyStatus(newStatus)
    .then((data) => {
      document.getElementById("myStatusResult").classList.remove("hidden");
      if (data && data.success) {
        document.getElementById("myStatusResult").innerHTML =
          `<div class="ui positive message">
          <div class="header">Success!</div>
          <p>Your status has been updated to: <strong>${newStatus}</strong></p>
        </div>`;
        showSuccess("Status updated successfully");
        $("#currentStatusDisplay").val(newStatus);
        $("#newStatusInput").val("");
        updateStatusCharCount();
      } else {
        document.getElementById("myStatusResult").innerHTML =
          `<div class="ui negative message">Failed to update status: ${data.error || "Unknown error"}</div>`;
        showError("Failed to update status");
      }
    })
    .catch((error) => {
      console.error("Error setting status:", error);
      document.getElementById("myStatusResult").classList.remove("hidden");
      document.getElementById("myStatusResult").innerHTML =
        '<div class="ui negative message">Error updating status. Please try again.</div>';
      showError("Error updating status");
    });
}

async function setMyStatus(status) {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");

  try {
    const response = await fetch(baseUrl + "/user/status", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify({ status: status }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to set status");
    }

    return data;
  } catch (error) {
    console.error("Error in setMyStatus function:", error);
    throw error;
  }
}

// Send Presence functionality
function doSendPresence() {
  const presenceType = $("#presenceTypeSelect").val();
  if (!presenceType) {
    showError("Please select a presence type");
    return;
  }

  sendPresence(presenceType)
    .then((data) => {
      document.getElementById("sendPresenceResult").classList.remove("hidden");
      if (data && (data.success || data.Details || data.message)) {
        const successMessage =
          data.Details || data.message || "Presence set successfully";
        document.getElementById("sendPresenceResult").innerHTML =
          `<div class="ui positive message">
          <div class="header">Success!</div>
          <p>Your presence has been set to: <strong>${presenceType}</strong></p>
          <p>${successMessage}</p>
        </div>`;
        showSuccess(`Presence set to ${presenceType}`);
      } else {
        document.getElementById("sendPresenceResult").innerHTML =
          `<div class="ui negative message">Failed to set presence: ${data.error || "Unknown error"}</div>`;
        showError("Failed to set presence");
      }
    })
    .catch((error) => {
      console.error("Error setting presence:", error);
      document.getElementById("sendPresenceResult").classList.remove("hidden");
      document.getElementById("sendPresenceResult").innerHTML =
        '<div class="ui negative message">Error setting presence. Please try again.</div>';
      showError("Error setting presence");
    });
}

async function sendPresence(type) {
  const token = getLocalStorageItem("token");
  const myHeaders = new Headers();
  myHeaders.append("token", token);
  myHeaders.append("Content-Type", "application/json");

  try {
    const response = await fetch(baseUrl + "/user/presence", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify({ type: type }),
    });

    const data = await response.json();

    if (response.ok && data.success !== false) {
      return data;
    } else {
      throw new Error(data.error || "Failed to send presence");
    }
  } catch (error) {
    console.error("Error in sendPresence function:", error);
    throw error;
  }
}

// Check User Events
document.getElementById("checkUser").addEventListener("click", function () {
  document.getElementById("checkUserResult").innerHTML = "";
  document.getElementById("checkUserResult").classList.add("hidden");
  $("#modalCheckUser")
    .modal({
      onApprove: function () {
        doCheckUser();
        return false;
      },
    })
    .modal("show");
});

document
  .getElementById("checkUserInput")
  .addEventListener("keypress", function (e) {
    if (e.key === "Enter" && e.ctrlKey) {
      doCheckUser();
    }
  });

// Privacy Settings Events
document
  .getElementById("myPrivacySettings")
  .addEventListener("click", function () {
    document.getElementById("privacySettingsResult").innerHTML = "";
    document.getElementById("privacySettingsResult").classList.add("hidden");
    $("#modalPrivacySettings").modal("show");
  });

document
  .getElementById("loadPrivacySettingsBtn")
  .addEventListener("click", function () {
    loadPrivacySettings();
  });

// Change Push Name Events
document
  .getElementById("changePushName")
  .addEventListener("click", function () {
    document.getElementById("changePushNameResult").innerHTML = "";
    document.getElementById("changePushNameResult").classList.add("hidden");
    $("#modalChangePushName")
      .modal({
        onApprove: function () {
          doChangePushName();
          return false;
        },
      })
      .modal("show");
  });

document
  .getElementById("newPushNameInput")
  .addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      doChangePushName();
    }
  });

// My Status Events
document.getElementById("myStatus").addEventListener("click", function () {
  document.getElementById("myStatusResult").innerHTML = "";
  document.getElementById("myStatusResult").classList.add("hidden");
  $("#modalMyStatus")
    .modal({
      onApprove: function () {
        doSetMyStatus();
        return false;
      },
    })
    .modal("show");
  // Load current status when modal opens
  loadCurrentStatus();
  // Initialize character count
  updateStatusCharCount();
});

document
  .getElementById("newStatusInput")
  .addEventListener("input", function () {
    updateStatusCharCount();
  });

document
  .getElementById("newStatusInput")
  .addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      doSetMyStatus();
    }
  });

// Send Presence Events
document.getElementById("sendPresence").addEventListener("click", function () {
  document.getElementById("sendPresenceResult").innerHTML = "";
  document.getElementById("sendPresenceResult").classList.add("hidden");
  $("#modalSendPresence")
    .modal({
      onApprove: function () {
        doSendPresence();
        return false;
      },
    })
    .modal("show");
});

// Initialize dropdowns
$("#presenceTypeSelect").dropdown();

document
  .getElementById("loadCurrentStatusBtn")
  .addEventListener("click", function () {
    loadCurrentStatus();
  });

document
  .getElementById("newStatusInput")
  .addEventListener("input", function () {
    updateStatusCharCount();
  });

// Send Presence Events
document.getElementById("sendPresence").addEventListener("click", function () {
  document.getElementById("sendPresenceResult").innerHTML = "";
  document.getElementById("sendPresenceResult").classList.add("hidden");
  $("#modalSendPresence")
    .modal({
      onApprove: function () {
        doSendPresence();
        return false;
      },
    })
    .modal("show");
});

// Initialize dropdowns
$("#presenceTypeSelect").dropdown();

// Update Profile Events
document.getElementById("updateProfile").addEventListener("click", function () {
  // Clear previous messages and form
  document.getElementById("updateProfileSuccess").classList.add("hidden");
  document.getElementById("updateProfileError").classList.add("hidden");
  document.getElementById("updateProfileName").value = "";
  document.getElementById("updateProfileToken").value = "";

  $("#modalUpdateProfile")
    .modal({
      onApprove: function () {
        doUpdateProfile();
        return false;
      },
    })
    .modal("show");
});

async function doUpdateProfile() {
  const name = document.getElementById("updateProfileName").value.trim();
  const token = document.getElementById("updateProfileToken").value.trim();

  // Hide previous messages
  document.getElementById("updateProfileSuccess").classList.add("hidden");
  document.getElementById("updateProfileError").classList.add("hidden");

  // Validate at least one field is provided
  if (!name && !token) {
    document.getElementById("updateProfileError").classList.remove("hidden");
    document.getElementById("updateProfileErrorMessage").textContent =
      "Please provide at least one field to update (name or token).";
    return;
  }

  // Validate token length if provided
  if (token && token.length < 8) {
    document.getElementById("updateProfileError").classList.remove("hidden");
    document.getElementById("updateProfileErrorMessage").textContent =
      "Token must be at least 8 characters long.";
    return;
  }

  // Build request body with only provided fields
  const requestBody = {};
  if (name) requestBody.name = name;
  if (token) requestBody.token = token;

  try {
    const currentToken = getLocalStorageItem("token");
    const response = await fetch("/user/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: currentToken,
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    if (response.ok) {
      // Update local storage with new token if changed
      if (token) {
        setLocalStorageItem("token", result.token, 1);
      }

      // Show success message
      document
        .getElementById("updateProfileSuccess")
        .classList.remove("hidden");
      document.getElementById("updateProfileSuccessMessage").textContent =
        result.message + " Please refresh the page to see the changes.";

      // Close modal after 2 seconds and reload page
      setTimeout(function () {
        $("#modalUpdateProfile").modal("hide");
        location.reload();
      }, 2000);
    } else {
      // Show error message
      document.getElementById("updateProfileError").classList.remove("hidden");
      document.getElementById("updateProfileErrorMessage").textContent =
        result.error || result.message || "Failed to update profile";
    }
  } catch (error) {
    document.getElementById("updateProfileError").classList.remove("hidden");
    document.getElementById("updateProfileErrorMessage").textContent =
      "Network error: " + error.message;
    console.error("Update profile error:", error);
  }
}

// Instance Management Functions
async function connectInstance(instanceId, token) {
  try {
    const result = await connect(token);

    // Check the response properly
    if (result.success) {
      showSuccess("Instance connected successfully");
      updateAdmin();
    } else {
      // Handle API error responses
      const errorMsg =
        result.error || result.message || "Unknown error to connect instance";
      if (result.code === 500 && result.error === "no session") {
        showError("Failed to connect instance: No active session found");
      } else {
        showError(`Failed to connect instance: ${errorMsg}`);
      }
    }
  } catch (error) {
    showError("Failed to connect instance: " + error.message);
    console.error("Connect error:", error);
  }
}

async function refreshInstance(instanceId, token) {
  try {
    const myHeaders = new Headers();
    myHeaders.append("token", token);
    myHeaders.append("Content-Type", "application/json");

    const res = await fetch(baseUrl + "/session/refresh", {
      method: "POST",
      headers: myHeaders,
    });

    const data = await res.json();

    // Check if request was successful
    if (data.success && data.data && data.data.refreshSuccess) {
      const details = data.data.Details || "Connection refreshed successfully";
      showSuccess(`Instance refreshed successfully: ${details}`);
      updateAdmin();
    } else if (data.success && data.data) {
      // Even if refreshSuccess is false, but we got valid data, show what happened
      const details =
        data.data.Details || "Refresh completed but may have issues";
      showSuccess(`Instance refreshed successfully: ${details}`);
      updateAdmin();
    } else {
      // Only show error if the entire request failed
      const errorMsg = data.error || data.message || "Unknown refresh error";
      showError(`Failed to refresh instance: ${errorMsg}`);
    }
  } catch (error) {
    showError("Failed to refresh instance: " + error.message);
    console.error("Refresh error:", error);
  }
}

async function disconnectInstance(instanceId, token) {
  try {
    const result = await disconnect(token);

    // Check the response properly
    if (result.success) {
      showSuccess("Instance disconnected successfully");
      updateAdmin();
    } else {
      // Handle API error responses
      const errorMsg =
        result.error ||
        result.message ||
        "Unknown error to disconnect instance";
      if (result.code === 500 && result.error === "no session") {
        showError("Failed to disconnect instance: No active session found");
      } else {
        showError(`Failed to disconnect instance: ${errorMsg}`);
      }
    }
  } catch (error) {
    showError("Failed to disconnect instance: " + error.message);
    console.error("Disconnect error:", error);
  }
}

async function logoutInstance(instanceId, token) {
  try {
    const result = await logout(token);

    // Check the response properly
    if (result.success) {
      showSuccess("Logout instance successfully");
      updateAdmin();
    } else {
      // Handle API error responses
      const errorMsg =
        result.error || result.message || "Unknown error to logout instance";
      if (result.code === 500 && result.error === "no session") {
        showError("Failed to logout instance: No active session found");
      } else {
        showError(`Failed to logout instance: ${errorMsg}`);
      }
    }
  } catch (error) {
    showError("Failed to logout instance: " + error.message);
    console.error("Logout error:", error);
  }
}

function openPairModal(instanceId, token) {
  // Set the token for this pairing session
  setLocalStorageItem("currentPairingToken", token, 1);
  setLocalStorageItem("currentPairingInstance", instanceId, 1);

  // Reset modal content
  document.getElementById("pairInfo").innerHTML = "How to pair?";
  document.getElementById("pairInfo").classList.remove("hidden");
  document.getElementById("pairHelp").classList.remove("hidden");
  document.getElementById("pairphoneinput").value = "";

  modalPairPhone();
}
