import React from "react";
import "./App.css";
var assert = require("assert");

let controller;

function getAPIforWindow() {
  const location = window.location;
  const htmlUrl = location.origin + location.pathname;
  assert(htmlUrl.slice(-4) === "html");
  const jsonUrl = htmlUrl.slice(0, -4) + "json";
  return jsonUrl + location.search;
}

function Link(props) {
  return (
    <button
      type="button"
      className={"Link " + (props.className || "")}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

class Filter extends React.Component {
  handleRemove(event) {
    var newFilters = this.props.query.filters.slice();
    newFilters.splice(this.props.index, 1);
    this.props.handleQueryChange({ filters: newFilters });
  }

  handleLookupChange(event) {
    var newFilters = this.props.query.filters.slice();
    newFilters[this.props.index] = {
      ...newFilters[this.props.index],
      lookup: event.target.value,
    };
    this.props.handleQueryChange({ filters: newFilters });
  }

  handleValueChange(event) {
    var newFilters = this.props.query.filters.slice();
    newFilters[this.props.index] = {
      ...newFilters[this.props.index],
      value: event.target.value,
    };
    this.props.handleQueryChange({ filters: newFilters });
  }

  render() {
    return (
      <p className={this.props.errorMessage ? "Error" : undefined}>
        <Link onClick={this.handleRemove.bind(this)}>✘</Link> {this.props.name}{" "}
        <select value={this.props.lookup} onChange={this.handleLookupChange.bind(this)}>
          {this.props.getFieldType(this.props.name).lookups.map((lookup) => (
            <option key={lookup.name} value={lookup.name}>
              {lookup.name}
            </option>
          ))}
        </select>{" "}
        ={" "}
        <input
          type="text"
          name={`${this.props.name}__${this.props.lookup}`}
          value={this.props.value}
          onChange={this.handleValueChange.bind(this)}
        />
        {this.props.errorMessage}
      </p>
    );
  }
}

function Filters(props) {
  return (
    <form className="Filters">
      {props.query.filters.map((filter, index) => (
        <Filter
          {...filter}
          key={index}
          index={index}
          query={props.query}
          handleQueryChange={props.handleQueryChange}
          getFieldType={props.getFieldType}
        />
      ))}
    </form>
  );
}

class Toggle extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isToggleOn: false };
  }

  handleClick() {
    this.setState((state) => ({
      isToggleOn: !state.isToggleOn,
    }));
  }

  render() {
    if (this.state.isToggleOn) {
      return (
        <>
          <Link className="ToggleLink" onClick={this.handleClick.bind(this)}>
            > {this.props.title}
          </Link>
          <div className="ToggleDiv">{this.props.children}</div>
        </>
      );
    } else {
      return (
        <Link className="ToggleLink" onClick={this.handleClick.bind(this)}>
          + {this.props.title}
        </Link>
      );
    }
  }
}

function Fields(props) {
  return (
    <ul className="FieldsList">
      {props.fields.map((field) => {
        function handleAddFilter() {
          var newFilters = props.query.filters.slice();
          newFilters.push({
            errorMessage: null,
            name: field.name,
            lookup: "",
            value: "",
          });
          props.handleQueryChange({ filters: newFilters });
        }

        function handleAddField() {
          var newFields = props.query.fields.slice();
          newFields.push({
            name: field.name,
            sort: null,
            concrete: false,
          });
          props.handleQueryChange({ fields: newFields });
        }

        return (
          <li key={field.name}>
            {field.concrete ? (
              <Link onClick={handleAddFilter}>Y</Link>
            ) : (
              <>&nbsp;&nbsp;</>
            )}{" "}
            <Link onClick={handleAddField}>{field.name}</Link>
          </li>
        );
      })}

      {props.fks.map((fk) => (
        <li key={fk.name}>
          <Toggle title={fk.name}>
            <Fields {...fk} />
          </Toggle>
        </li>
      ))}
    </ul>
  );
}

function ResultsHead(props) {
  return (
    <thead>
      <tr>
        {props.query.fields.map((field, index) => {
          function handleRemove() {
            var newFields = props.query.fields.slice();
            newFields.splice(index, 1);
            props.handleQueryChange({
              fields: newFields,
            });
          }

          function handleAddFilter() {
            var newFilters = props.query.filters.slice();
            newFilters.push({
              errorMessage: null,
              name: field.name,
              lookup: "",
              value: "",
            });
            props.handleQueryChange({
              filters: newFilters,
            });
          }

          function handleToggleSort() {
            var newFields = props.query.fields.slice();
            newFields[index] = {
              ...field,
              sort: { asc: "dsc", dsc: null, null: "asc" }[field.sort],
            };
            props.handleQueryChange({
              fields: newFields,
            });
          }

          return (
            <th key={field.name}>
              <Link onClick={handleRemove}>✘</Link>{" "}
              {field.concrete ? (
                <>
                  <Link onClick={handleAddFilter}>Y</Link>{" "}
                  <Link onClick={handleToggleSort}>{field.name}</Link>{" "}
                  {{ dsc: "↑", asc: "↓", null: "" }[field.sort]}
                </>
              ) : (
                field.name
              )}
            </th>
          );
        })}
        {!props.query.fields.length && <th>No fields selected</th>}
      </tr>
    </thead>
  );
}

function ResultsBody(props) {
  return (
    <tbody>
      {props.data.map((row, index) => (
        <tr key={index}>
          {row.map((cell, index) => (
            <td key={index}>{cell}</td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

function Results(props) {
  return (
    <table>
      <ResultsHead query={props.query} handleQueryChange={props.handleQueryChange} />
      <ResultsBody data={props.data} />
    </table>
  );
}

function Page(props) {
  return (
    <div id="body">
      <h1>{props.model}</h1>
      <p>
        <a href={props.csvLink}>Download as CSV</a>
      </p>
      <p>
        <a href={props.saveLink}>Save View</a>
      </p>

      <Filters
        query={props.query}
        handleQueryChange={props.handleQueryChange}
        getFieldType={props.getFieldType}
      />

      <p>Showing {props.data.length} results</p>
      <div className="MainSpace">
        <div>
          <Fields
            query={props.query}
            handleQueryChange={props.handleQueryChange}
            {...props.allFields}
          />
        </div>
        <Results
          query={props.query}
          handleQueryChange={props.handleQueryChange}
          data={props.data}
        />
      </div>
    </div>
  );
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      query: { filters: [], fields: [] },
    };
  }

  fetchData(url) {
    if (controller) controller.abort();
    controller = new AbortController();

    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then(
        (result) => {
          this.setState({
            data: result.data,
            query: { fields: result.fields, filters: result.filters },
          });
        },
        (error) => {
          this.setState({
            error,
          });
        }
      );
  }

  componentDidMount() {
    this.fetchData(getAPIforWindow());
    window.onpopstate = (e) => {
      this.fetchData(getAPIforWindow());
    };
  }

  handleQueryChange(queryChange) {
    const newQuery = { ...this.state.query, ...queryChange };
    this.setState({ query: newQuery });
    window.history.pushState(null, null, this.getUrlForQuery(newQuery, "html"));
    this.fetchData(this.getUrlForQuery(newQuery, "json"));
  }

  getPartsForQuery(query) {
    return {
      app: this.props.model.split(".")[0],
      model: this.props.model.split(".")[1],
      fields: query.fields
        .map((field) => ({ asc: "+", dsc: "-", null: "" }[field.sort] + field.name))
        .join(","),
      query: query.filters
        .map((filter) => `${filter.name}__${filter.lookup}=${filter.value}`)
        .join("&"),
    };
  }

  getSaveUrl(query) {
    const parts = this.getPartsForQuery(this.state.query);
    const queryString = new URLSearchParams(parts).toString();
    return `${window.location.origin}${this.props.adminUrl}?${queryString}`;
  }

  getUrlForQuery(query, media) {
    const parts = this.getPartsForQuery(query);
    const basePath = `${this.props.baseUrl}query/${parts.app}/${parts.model}`;
    return `${window.location.origin}${basePath}/${parts.fields}.${media}?${parts.query}`;
  }

  getFieldType(path) {
    const parts = path.split("__");
    const field = parts.slice(-1);
    const model = this.getFkModel(parts.slice(0, -1).join("__"));
    const type = this.props.fields[model].fields[field]["type"];
    return this.props.types[type];
  }

  getFkModel(path) {
    var model = this.props.model;
    if (path) {
      for (const field of path.split("__")) {
        model = this.props.fields[model].fks[field]["model"];
      }
    }
    return model;
  }

  render() {
    return (
      <Page
        data={this.state.data}
        query={this.state.query}
        allFields={this.props.allFields}
        handleQueryChange={this.handleQueryChange.bind(this)}
        model={this.props.model}
        saveLink={this.getSaveUrl()}
        csvLink={this.getUrlForQuery(this.state.query, "csv")}
        getFkModel={this.getFkModel.bind(this)}
        getFieldType={this.getFieldType.bind(this)}
      />
    );
  }
}

export default App;
