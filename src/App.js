import React, { Component } from 'react';

import './App.css'
import Rete from "rete";
import ConnectionPlugin from 'rete-connection-plugin';
import ReactRenderPlugin, { Node, Socket, Control } from 'rete-react-render-plugin';
import ContextMenuPlugin from 'rete-context-menu-plugin';

const responsesSocket = new Rete.Socket('Response');
const conditionsSocket = new Rete.Socket('Conditions');
const logicalAndSocket = new Rete.Socket('LogicalAnd')
logicalAndSocket.combineWith(conditionsSocket)
const logicalOrSocket = new Rete.Socket('LogicalOr')
logicalOrSocket.combineWith(conditionsSocket)
const logicalThenSocket = new Rete.Socket('LogicalThen')
logicalThenSocket.combineWith(responsesSocket)

class ReactBaseComponent extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      text: this.props.text
    }
    this.onUpdate = props.onUpdate
    if (this.onUpdate === undefined) {
      this.onUpdate = () => {}
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.text !== this.props.text) {
      this.setState({ text: this.props.text })
    } else if (prevState.text !== this.state.text) {
      this.onUpdate(this.state.text)
    }
  }

  render () {
    return (<React.Fragment>
        {this.state.label}:
        <br/>
        <div className='text-fragment' title={this.state.text}>
          {this.state.text}
        </div>
        <input type='button' value='...' onClick={(e) => this.setState({ text: prompt('Enter Text:', this.state.text) }) } />
      </React.Fragment>)
  }
}

class ReactStartComponent extends ReactBaseComponent {
  constructor(props) {
    super(props)
    this.state = { label: "Greeting" }
  }
}

class ReactResponseComponent extends ReactBaseComponent {
  constructor(props) {
    super(props)
    this.state = { label: 'Player Response'}
  }
}

class ReactSpeechComponent extends ReactBaseComponent {
  constructor(props) {
    super(props)
    this.state = { label: 'NPC Speech'}
  }
}

class ReactEndComponent extends ReactBaseComponent {
  constructor(props) {
    super(props)
    this.state = { label: "Farewell" }
  }
}

class ReactConditionComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      conditions: [],
      selectedCondition: 'has_item',
      selectedParam: 'exactly',
      paramNameValue: '',
      paramQtyValue: 0
    }

    this.definitions = [
      {
        name: "Has Item",
        id: "has_item",
        params: [
          {name: 'Item Name', id: 'item_name', value: ''},
          {name: 'Logical Comparison', id: 'comparison', value: 'exactly', values: [
            {name: '=', id: 'exactly'},
            {name: '>', id: 'morethan'},
            {name: '<', id: 'lessthan'},
            {name: '>=', id: 'morethanorequal'},
            {name: '<=', id: 'lessthanorequal'},
            {name: '!=', id: 'notequal'},
          ]},
          {name: 'Quantity', id: 'qty'}
        ]
      }
    ]
  }

  componentDidMount() {

  }

  render () {
    let options = []
    for (let id in this.definitions) {
      let condition = this.definitions[id]
      let selected = false
      if (this.state.selectedCondition === condition.id) {
        selected = true
      }
      options.push(<option value={selected}>{condition.name}</option>)
    }

    let condition = this.definitions.filter(f => f.id === this.state.selectedCondition)
    let logics = []
    if (condition.length > 0) {
      condition = condition[0]
      let param = condition.params.filter(f => f.id === 'comparison')
      if (param.length > 0 && param[0].values !== undefined) {
        param = param[0]
        for (let id in param.values) {
          let selected = false
          if (this.state.selectedParam === param.values[id].id) {
            selected = true
          }
          logics.push(<option value={selected}>{param.values[id].name}</option>)
        }
      }
    }
    return (<React.Fragment>
        <select className='condition-name'>{options}</select><input className='condition-param-name' type='text' value={this.state.paramNameValue} onChange={(e) => this.setState({ paramNameValue: e.target.value })} /><br />
        <select className='condition-logic'>{logics}</select><input type='text' value={this.state.paramQtyValue} className='condition-param-qty' onChange={(e) => this.setState({ paramQtyValue: e.target.value })} />
      </React.Fragment>)
  }

}

class ConversationStartControl extends Rete.Control {
  constructor(emitter, key, name) {
    super(key)
    this.render = 'react'
    this.component = ReactStartComponent
    this.props =  { emitter, name, onUpdate: (v) => this.putData(key, v)  }
  }
}

class ConversationEndControl extends Rete.Control {
  constructor(emitter, key, name) {
    super(key)
    this.render = 'react'
    this.component = ReactEndComponent
    this.props =  { emitter, name, onUpdate: (v) => this.putData(key, v)  }
  }
}

class ConversationConditionControl extends Rete.Control {
  constructor(emitter, key, name) {
    super(key)
    this.render = 'react'
    this.component = ReactConditionComponent
    this.props = { emitter, name }
  }
}

class ConversationResponseControl extends Rete.Control {
  constructor(emitter, key, name) {
    super(key)
    this.render = 'react'
    this.component = ReactResponseComponent
    this.props = { emitter, name, onUpdate: (v) => this.putData(key, v) }
  }
}

class ConversationSpeechControl extends Rete.Control {
  constructor(emitter, key, name) {
    super(key)
    this.render = 'react'
    this.component = ReactSpeechComponent
    this.props = { emitter, name, onUpdate: (v) => this.putData(key, v)  }
  }
}

class QuestNode extends Node {
  render() {
    const { node, bindSocket, bindControl } = this.props;
    const { outputs, controls, inputs, selected } = this.state;

    return (
      <div className={`node ${selected}`}>
        <div className="title">{node.name}</div>
        {/* Outputs */}
        {outputs.map((output) => (
          <div className="output" key={output.key}>
            <div className="output-title">{output.name}</div>
            <Socket type="output" socket={output.socket} io={output} innerRef={bindSocket} />
          </div>
        ))}
        {/* Controls */}
        {controls.map(control => (
          <Control className="control" key={control.key} control={control} innerRef={bindControl} />
        ))}
        {/* Inputs */}
        {inputs.map(input => (
          <div className="input" key={input.key}>
            <Socket type="input" socket={input.socket} io={input} innerRef={bindSocket} />
            {!input.showControl() && <div className="input-title">{input.name}</div>}
            {input.showControl() && <Control className="input-control" control={input.control} innerRef={bindControl} />}
          </div>
        ))}
      </div>
    )
  }
}

class ConversationStartComponent extends Rete.Component {
  constructor() {
    super('Conversation Start');
    this.data.component = QuestNode;
  }

  builder(node) {
    let out = new Rete.Output('condition', 'Conditions', conditionsSocket);
    let text = new ConversationStartControl(this.editor, 'text', node)
    let outThen = new Rete.Output('logicalThen', "Then", logicalThenSocket)
    node.addControl(text).addOutput(out).addOutput(outThen);
  }

}

class ConversationEndComponent extends Rete.Component {
  constructor() {
    super('Conversation End');
    this.data.component = QuestNode
  }

  builder(node) {
    let input = new Rete.Input('response', 'Response', responsesSocket, true);
    let inThen = new Rete.Input('condition', "Conditions", conditionsSocket)
    node.addControl(new ConversationEndControl(this.editor, 'text', node))
    node.addInput(input).addInput(inThen)
  }

}

class ConversationConditionsComponent extends Rete.Component {
  constructor () {
    super("Condition")
    this.data.component = QuestNode
  }

  builder (node) {
    let input = new Rete.Input("conditions", "Condition", conditionsSocket)
    node.addInput(input)

    let outAnd = new Rete.Output("logicalAnd", "AND", logicalAndSocket)
    let outOr = new Rete.Output("logicalOr", "OR", logicalOrSocket)
    let outThen = new Rete.Output('logicalThen', "Then", logicalThenSocket)
    node.addControl(new ConversationConditionControl(this.editor, 'text', node))
    node.addOutput(outAnd)
    node.addOutput(outOr)
    node.addOutput(outThen)
  }
}

class ConversationResponsesComponent extends Rete.Component {
  constructor () {
    super("Response")
    this.data.component = QuestNode
  }

  builder (node) {
    let input = new Rete.Input("response", "Response", responsesSocket)
    node.addInput(input)

    let out = new Rete.Output("conditions", "Conditions", conditionsSocket)
    let outThen = new Rete.Output('logicalThen', "Then", logicalThenSocket)
    node.addOutput(out).addOutput(outThen)

    node.addControl(new ConversationResponseControl(this.editor, 'text', node))
  }

  worker (node, inputs, output) {
    output["response"] = node.data.responses
    
  }
}

class ConversationSpeechComponent extends Rete.Component {
  constructor () {
    super("Speech")
    this.data.component = QuestNode
  }

  builder (node) {
    let input = new Rete.Input("response", "Response", responsesSocket)
    node.addInput(input)

    let out = new Rete.Output("conditions", "Conditions", conditionsSocket)
    let outThen = new Rete.Output('logicalThen', "Then", logicalThenSocket)
    node.addOutput(out).addOutput(outThen)
    node.addControl(new ConversationSpeechControl(this.editor, 'text', node))
  }

  worker (node, inputs, output) {
    output["response"] = node.data.responses
    
  }
}

class App extends Component {

  constructor(props)
  {
    super(props)

    this.reteRef = React.createRef()

  }

  componentDidMount () {
    this.initializeRete()
  }

  async initializeRete ()
  { 
    let editor = new Rete.NodeEditor('demo@0.1.0', this.reteRef.current);

    editor.use(ConnectionPlugin)
    editor.use(ReactRenderPlugin, {
      component: QuestNode
    })
    
    const startComponent = new ConversationStartComponent();
    editor.register(startComponent);
    const responsesComponent = new ConversationResponsesComponent();
    editor.register(responsesComponent)
    const conditionsComponent = new ConversationConditionsComponent();
    editor.register(conditionsComponent)
    const endComponent = new ConversationEndComponent();
    editor.register(endComponent)
    const speechComponent = new ConversationSpeechComponent();
    editor.register(speechComponent)

    const engine = new Rete.Engine('demo@0.1.0');
    engine.register(startComponent);
    engine.register(responsesComponent)

    const startNode = await startComponent.createNode()
    editor.addNode(startNode)
    
    editor.use(ContextMenuPlugin, {
        searchBar: false,
        delay: 100,
        allocate(component) {
            return ['Submenu']
        },
        items: {
            /*'Click me'(){ console.log('Works!') }*/
        }
    });

    editor.on('click', async (e) => {
      
    })

    this.editor = editor
  }

  export() {
    console.log(this.editor.toJSON())
  }

  render () {
    return (
      <div className="App">
        <header className="App-header">
          Medieval-Quests Editor
          <br />
          <input type='button' value='Export' onClick={() => this.export()}/>
        </header>
        {<div id="rete" className="Rete" ref={this.reteRef} />}
      </div>

    );
  }
};

export default App;