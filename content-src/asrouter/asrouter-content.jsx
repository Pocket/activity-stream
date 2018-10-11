import {LocalizationProvider, Localized} from "fluent-react";
import {actionCreators as ac} from "common/Actions.jsm";
import {OUTGOING_MESSAGE_NAME as AS_GENERAL_OUTGOING_MESSAGE_NAME} from "content-src/lib/init-store";
import {ImpressionsWrapper} from "./components/ImpressionsWrapper/ImpressionsWrapper";
import {MessageContext} from "fluent";
import {OnboardingMessage} from "./templates/OnboardingMessage/OnboardingMessage";
import React from "react";
import ReactDOM from "react-dom";
import {safeURI} from "./template-utils";
import {SimpleSnippet} from "./templates/SimpleSnippet/SimpleSnippet";
import {SubmitFormSnippet} from "./templates/SubmitFormSnippet/SubmitFormSnippet";

// Key names matching schema name of templates
const SnippetComponents = {
  simple_snippet: SimpleSnippet,
  newsletter_snippet: props => <SubmitFormSnippet {...props} form_method="POST" />,
  fxa_signup_snippet: props => <SubmitFormSnippet {...props} form_method="GET" />,
};

const INCOMING_MESSAGE_NAME = "ASRouter:parent-to-child";
const OUTGOING_MESSAGE_NAME = "ASRouter:child-to-parent";
const ASR_CONTAINER_ID = "asr-newtab-container";

export const ASRouterUtils = {
  addListener(listener) {
    global.RPMAddMessageListener(INCOMING_MESSAGE_NAME, listener);
  },
  removeListener(listener) {
    global.RPMRemoveMessageListener(INCOMING_MESSAGE_NAME, listener);
  },
  sendMessage(action) {
    global.RPMSendAsyncMessage(OUTGOING_MESSAGE_NAME, action);
  },
  blockById(id, options) {
    ASRouterUtils.sendMessage({type: "BLOCK_MESSAGE_BY_ID", data: {id, ...options}});
  },
  dismissById(id) {
    ASRouterUtils.sendMessage({type: "DISMISS_MESSAGE_BY_ID", data: {id}});
  },
  blockBundle(bundle) {
    ASRouterUtils.sendMessage({type: "BLOCK_BUNDLE", data: {bundle}});
  },
  executeAction(button_action) {
    ASRouterUtils.sendMessage({
      type: "USER_ACTION",
      data: button_action,
    });
  },
  unblockById(id) {
    ASRouterUtils.sendMessage({type: "UNBLOCK_MESSAGE_BY_ID", data: {id}});
  },
  unblockBundle(bundle) {
    ASRouterUtils.sendMessage({type: "UNBLOCK_BUNDLE", data: {bundle}});
  },
  overrideMessage(id) {
    ASRouterUtils.sendMessage({type: "OVERRIDE_MESSAGE", data: {id}});
  },
  sendTelemetry(ping) {
    const payload = ac.ASRouterUserEvent(ping);
    global.RPMSendAsyncMessage(AS_GENERAL_OUTGOING_MESSAGE_NAME, payload);
  },
  getPreviewEndpoint() {
    if (window.location.href.includes("endpoint")) {
      const params = new URLSearchParams(window.location.href.slice(window.location.href.indexOf("endpoint")));
      try {
        const endpoint = new URL(params.get("endpoint"));
        return {
          url: endpoint.href,
          snippetId: params.get("snippetId"),
        };
      } catch (e) {}
    }

    return null;
  },
};

// Note: nextProps/prevProps refer to props passed to <ImpressionsWrapper />, not <ASRouterUISurface />
function shouldSendImpressionOnUpdate(nextProps, prevProps) {
  return (nextProps.message.id && (!prevProps.message || prevProps.message.id !== nextProps.message.id));
}

function generateMessages(content) {
  const cx = new MessageContext("en-US");
  Object.keys(content).forEach(key => {
    cx.addMessages(`${key} = ${content[key]}`);
  });
  return [cx];
}

// Elements allowed in snippet content
const ALLOWED_TAGS = {
  b: <b />,
  i: <i />,
  u: <u />,
  strong: <strong />,
  em: <em />,
  br: <br />,
};

/**
 * Transform an object (tag name: {url}) into (tag name: anchor) where the url
 * is used as href, in order to render links inside a Fluent.Localized component.
 */
export function convertLinks(links, sendClick) {
  if (links) {
    return Object.keys(links).reduce((acc, linkTag) => {
      const {action} = links[linkTag];
      // Setting the value to false will not include the attribute in the anchor
      const url = action ? false : safeURI(links[linkTag].url);

      acc[linkTag] = (<a href={url}
        data-metric={links[linkTag].metric}
        data-action={action}
        data-args={links[linkTag].args}
        onClick={sendClick} />);
      return acc;
    }, {});
  }

  return null;
}

/**
 * Message wrapper used to sanitize markup and render HTML.
 */
function RichText(props) {
  return (
    <Localized id={props.localization_id} {...ALLOWED_TAGS} {...convertLinks(props.links, props.sendClick)}>
      <span>{props.text}</span>
    </Localized>
  );
}

export class ASRouterUISurface extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onMessageFromParent = this.onMessageFromParent.bind(this);
    this.sendClick = this.sendClick.bind(this);
    this.sendImpression = this.sendImpression.bind(this);
    this.sendUserActionTelemetry = this.sendUserActionTelemetry.bind(this);
    this.state = {message: {}, bundle: {}};
  }

  sendUserActionTelemetry(extraProps = {}) {
    const {message, bundle} = this.state;
    if (!message && !extraProps.message_id) {
      throw new Error(`You must provide a message_id for bundled messages`);
    }
    const eventType = `${message.provider || bundle.provider}_user_event`;
    ASRouterUtils.sendTelemetry({
      message_id: message.id || extraProps.message_id,
      source: extraProps.id,
      action: eventType,
      ...extraProps,
    });
  }

  sendImpression(extraProps) {
    if (this.state.message.provider === "preview") {
      return;
    }

    ASRouterUtils.sendMessage({type: "IMPRESSION", data: this.state.message});
    this.sendUserActionTelemetry({event: "IMPRESSION", ...extraProps});
  }

  // If link has a `metric` data attribute send it as part of the `value`
  // telemetry field which can have arbitrary values.
  // Used for router messages with links as part of the content.
  sendClick(event) {
    const metric = {
      value: event.target.dataset.metric,
      // Used for the `source` of the event. Needed to differentiate
      // from other snippet or onboarding events that may occur.
      id: "NEWTAB_FOOTER_BAR_CONTENT",
    };
    const action = {
      type: event.target.dataset.action,
      data: {args: event.target.dataset.args},
    };
    if (action.type) {
      ASRouterUtils.executeAction(action);
    }
    if (!this.state.message.content.do_not_autoblock) {
      ASRouterUtils.blockById(this.state.message.id);
    }
    if (this.state.message.provider !== "preview") {
      this.sendUserActionTelemetry({event: "CLICK_BUTTON", ...metric});
    }
  }

  onBlockById(id) {
    return options => ASRouterUtils.blockById(id, options);
  }

  onDismissById(id) {
    return () => ASRouterUtils.dismissById(id);
  }

  clearBundle(bundle) {
    return () => ASRouterUtils.blockBundle(bundle);
  }

  onMessageFromParent({data: action}) {
    switch (action.type) {
      case "SET_MESSAGE":
        this.setState({message: action.data});
        break;
      case "SET_BUNDLED_MESSAGES":
        this.setState({bundle: action.data});
        break;
      case "CLEAR_MESSAGE":
        if (action.data.id === this.state.message.id) {
          this.setState({message: {}});
        }
        break;
      case "CLEAR_PROVIDER":
        if (action.data.id === this.state.message.provider) {
          this.setState({message: {}});
        }
        break;
      case "CLEAR_BUNDLE":
        if (this.state.bundle.bundle) {
          this.setState({bundle: {}});
        }
        break;
      case "CLEAR_ALL":
        this.setState({message: {}, bundle: {}});
    }
  }

  componentWillMount() {
    const endpoint = ASRouterUtils.getPreviewEndpoint();
    ASRouterUtils.addListener(this.onMessageFromParent);

    // If we are loading about:welcome we want to trigger the onboarding messages
    if (this.props.document.location.href === "about:welcome") {
      ASRouterUtils.sendMessage({type: "TRIGGER", data: {trigger: {id: "firstRun"}}});
    } else {
      ASRouterUtils.sendMessage({type: "SNIPPETS_REQUEST", data: {endpoint}});
    }
  }

  componentWillUnmount() {
    ASRouterUtils.removeListener(this.onMessageFromParent);
  }

  renderSnippets() {
    let privacyNoticeRichText;
    const SnippetComponent = SnippetComponents[this.state.message.template];
    const {content} = this.state.message;

    if (this.state.message.template === "newsletter_snippet") {
      privacyNoticeRichText = (<RichText text={content.scene2_privacy_html}
        localization_id="privacy_notice"
        links={content.links}
        sendClick={this.sendClick} />);
    }

    return (
      <ImpressionsWrapper
        id="NEWTAB_FOOTER_BAR"
        message={this.state.message}
        sendImpression={this.sendImpression}
        shouldSendImpressionOnUpdate={shouldSendImpressionOnUpdate}
        // This helps with testing
        document={this.props.document}>
          <LocalizationProvider messages={generateMessages({
            privacy_notice: content.scene2_privacy_html,
            snippet_text: content.text || content.scene1_text,
          })}>
            <SnippetComponent
              {...this.state.message}
              richText={<RichText text={content.text || content.scene1_text}
                                  localization_id="snippet_text"
                                  links={this.state.message.content.links}
                                  sendClick={this.sendClick} />}
              privacyNoticeRichText={privacyNoticeRichText}
              UISurface="NEWTAB_FOOTER_BAR"
              onBlock={this.onBlockById(this.state.message.id)}
              onDismiss={this.onDismissById(this.state.message.id)}
              onAction={ASRouterUtils.executeAction}
              sendUserActionTelemetry={this.sendUserActionTelemetry} />
          </LocalizationProvider>
      </ImpressionsWrapper>);
  }

  renderOnboarding() {
    return (
      <OnboardingMessage
        {...this.state.bundle}
        UISurface="NEWTAB_OVERLAY"
        onAction={ASRouterUtils.executeAction}
        onDoneButton={this.clearBundle(this.state.bundle.bundle)}
        sendUserActionTelemetry={this.sendUserActionTelemetry} />);
  }

  renderPreviewBanner() {
    if (this.state.message.provider !== "preview") {
      return null;
    }

    return (
      <div className="snippets-preview-banner">
        <span className="icon icon-small-spacer icon-info" />
        <span>Preview Purposes Only</span>
      </div>
    );
  }

  render() {
    const {message, bundle} = this.state;
    if (!message.id && !bundle.template) { return null; }
    return (
      <React.Fragment>
        {this.renderPreviewBanner()}
        {bundle.template === "onboarding" ? this.renderOnboarding() : this.renderSnippets()}
      </React.Fragment>
    );
  }
}

ASRouterUISurface.defaultProps = {document: global.document};

export class ASRouterContent {
  constructor() {
    this.initialized = false;
    this.containerElement = null;
  }

  _mount() {
    this.containerElement = global.document.getElementById(ASR_CONTAINER_ID);
    if (!this.containerElement) {
      this.containerElement = global.document.createElement("div");
      this.containerElement.id = ASR_CONTAINER_ID;
      this.containerElement.style.zIndex = 1;
      global.document.body.appendChild(this.containerElement);
    }

    ReactDOM.render(<ASRouterUISurface />, this.containerElement);
  }

  _unmount() {
    ReactDOM.unmountComponentAtNode(this.containerElement);
  }

  init() {
    this._mount();
    this.initialized = true;
  }

  uninit() {
    if (this.initialized) {
      this._unmount();
      this.initialized = false;
    }
  }
}
