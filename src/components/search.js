import React from "react"
import { Link } from "react-router-dom";
import {
  TextField, IconButton, Icon, List, ListItem, Typography,
  ListItemText, ListItemAvatar, Avatar, LinearProgress, InputAdornment,
  Button, Paper
}
  from "@material-ui/core"
import { withStyles, makeStyles } from '@material-ui/core/styles';

import { ANILIST_BASE_URL, SEARCH_QUERY, PLACEHOLDER_SEIYUUS } from "../common";

const styles = theme => ({
  inline: {
    display: 'inline',
  },
  centerFlex: {
    display: 'flex',
    alignItems: 'center'
  },
  searchForm: {
    width: '60%',
    margin: '0 auto'
  },
  resultsPaper: {
    marginTop: '2em',
    maxWidth: '80%',
    marginLeft: 'auto',
    marginRight: 'auto',
  }
});

const randomSeiyuuPlaceholder = () => `try "${PLACEHOLDER_SEIYUUS[Math.floor(Math.random() * PLACEHOLDER_SEIYUUS.length)]}"`

const SearchResultItem = (props) => {
  const classes = makeStyles(styles)();

  return (
      <ListItem button divider={props.divider} component={Link} to={`/seiyuu/${props.staffId}`}>
        <ListItemAvatar>
          <Avatar variant="circle" alt={props.name} src={props.image} />
        </ListItemAvatar>
        <ListItemText
          disableTypography={true}
          primary={
            <Typography variant="body1">{props.name}</Typography>
          }
          secondary={
            <>
              <Typography variant="body2" style={{fontSize: "0.875rem"}}>Roles: {props.characters}</Typography>
              <div className={classes.centerFlex}>
                  <Icon style={{fontSize: "0.875rem"}}>favorite</Icon> &nbsp;
                  <Typography variant="body2" style={{fontSize: "0.875rem"}}>{props.favorites}</Typography>
              </div>
            </>
          }
        />
      </ListItem>
  )
}

const SearchResults = (props) => {
  const classes = makeStyles(styles)();

  return (
    <Paper className={classes.resultsPaper}>
      <List>
        {props.data.map((staff, i) =>
          <SearchResultItem key={staff.id} staffId={staff.id} name={staff.name} favorites={staff.favorites}
                image={staff.image} characters={staff.characters} divider={i < props.data.length - 1} />
        )}
      </List>
    </Paper>
  );
}

const RESULTS_PER_PAGE = 10;
class UnstyledSearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      query_text: '',
      seiyuu_results: [],
      is_loading: false,
      has_results: false,
    };
    this.search_data = [];
    this.next_page = 1;
    this.last_page = Number.MAX_SAFE_INTEGER;
  }

  componentDidUpdate(prevProps) {
    console.log("componentDidUpdate");
    if (this.props.location !== prevProps.location) {
      this.updateIfQuery();
    }
  }

  componentDidMount() {
    this.updateIfQuery();
  }

  updateIfQuery() {
      const query = this.props.match.params.query;
      console.log(query);
      if (query) {
        this.search_data = [];
        this.next_page = 1;
        this.last_page = Number.MAX_SAFE_INTEGER;
        this.setState({ query_text: query }, () => this.fetchResults(true));
      }
  }

  hasNextPage() {
    return this.search_data.length > 0 || this.next_page <= this.last_page;
  }

  async fetchResults(new_search) {
    if (!this.hasNextPage()) {
      console.log('called fetch_results while hasNextPage is false');
      return;
    }

    let done = false;
    let previous_results = this.state.seiyuu_results;
    if (new_search) {
      previous_results = [];
    }
    this.setState({ is_loading: true });

    for (let i = 0; !done && i < 10; ++i) {
      if (this.search_data.length < RESULTS_PER_PAGE && this.next_page <= this.last_page) {
        console.log("Fetching", this.next_page, this.last_page, this.search_data);
        const response = await fetch(ANILIST_BASE_URL , {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            query: SEARCH_QUERY,
            variables: {
              search: this.state.query_text,
              page: this.next_page,
              perPage: 50,
            }
          })
        });
        const reply = await response.json();
        console.log(reply)
        ++this.next_page;

        this.last_page = reply['data']['Page']['pageInfo']['lastPage'];
        const transformed = reply['data']['Page']['staff'].map(staff => ({
          id: staff['id'],
          favorites: staff['favourites'], // not a typo
          image: staff['image']['medium'],
          name: staff['name']['full'],
          characters: staff['characters']['pageInfo']['total'],
        }));
        console.log(transformed.filter(staff => staff.characters > 0));
        this.search_data = this.search_data.concat(transformed.filter(staff => staff.characters > 0));
      }

      console.log(this.search_data.length >= RESULTS_PER_PAGE, this.next_page > this.last_page);
      if (this.search_data.length >= RESULTS_PER_PAGE || this.next_page > this.last_page) {
        done = true;
      }
    }
    
    const new_results = previous_results.concat(this.search_data.splice(0, RESULTS_PER_PAGE));
    this.setState({
      seiyuu_results: new_results,
      is_loading: false,
      has_results: true,
    });
    console.log('done', this.state);
  }

  handleSubmit() {
    console.log("Searching");
    if (this.state.query_text) {
      this.props.history.push(`/search/${this.state.query_text}`);
    }
  }

  more() {
    console.log("More");
    this.fetchResults(false);
  }

  render() {
    const classes = this.props.classes;
    return (
      <div>
        <div>
          <form onSubmit={() => this.handleSubmit()} className={classes.searchForm}>
            <TextField
              variant="outlined"
              fullWidth
              placeholder={randomSeiyuuPlaceholder()}
              value={this.state.query_text}
              onChange={event => this.setState({ query_text: event.target.value })}
              InputProps={{
                endAdornment:
                  <InputAdornment position="end">
                    <IconButton type="submit" aria-label="search"><Icon>search</Icon></IconButton>
                  </InputAdornment>
              }} />
          </form>
        </div>
        {this.state.is_loading && <LinearProgress variant="query" className={classes.searchForm}/>}
        {this.state.has_results &&
            <>
              <SearchResults data={this.state.seiyuu_results} />
              <div style={{display: 'flex', justifyContent: 'center'}}>
                <Button disabled={this.state.is_loading || !this.hasNextPage()}
                    endIcon={<Icon>expand_more</Icon>} onClick={() => this.more()}>More</Button>
              </div>
            </>}
      </div>
    );
  }
}

export const Search = withStyles(styles)(UnstyledSearch);