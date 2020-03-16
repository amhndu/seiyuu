import React from "react"
import { Link } from "react-router-dom";
import { TextField, Button, Icon, Box, List, ListItem, Typography,
    Divider, ListItemText, ListItemAvatar, Avatar }
    from "@material-ui/core"
import { withStyles, makeStyles } from '@material-ui/core/styles';

import { ANILIST_BASE_URL, SEARCH_QUERY } from "../common";

const styles = theme => ({
  root: {
    // '& > *': {
    //   margin: theme.spacing(1),
    // },
  },
  inline: {
    display: 'inline',
  },
});

const SearchResultItem = (props) => {
  const classes = makeStyles(styles)();

  return (
    // <Link to={`/seiyuu/${props.key}`}>
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
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <Icon fontSize="small">favoriteBorder</Icon> &nbsp;
              <Typography variant="body2">{props.favorites}</Typography>
            </span>
          }
        />
      </ListItem>
    // </Link>
  )
}

const SearchResults = (props) => {
  return (
    <List>
      {props.data.map((staff, i) =>
        <SearchResultItem key={staff.id} staffId={staff.id} name={staff.name} favorites={staff.favorites}
              image={staff.image} divider={i < props.data.length - 1} />
      )}
    </List>
  );
}

class UnstyledSearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      query_text: '',
      search_data: []
    };
  }

  async fetch_results() {
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
          page: 1,
          perPage: 50,
        }
      })
    });
    const reply = await response.json();
    console.log(reply);
    const transformed = reply['data']['Page']['staff'].map(staff => ({
      id: staff['id'],
      favorites: staff['favourites'], // not a typo
      image: staff['image']['medium'],
      name: staff['name']['full']
    }));
    this.setState({search_data: transformed});
  }

  search() {
    if (this.state.query_text)
      this.fetch_results();
  }

  render() {
    const classes = this.props.classes;
    return (
      <div>
        <div className={classes.root}>
          <TextField variant="standard" default="Kana Hanazawa"
            onChange={event => this.setState({ query_text: event.target.value })} />
          <Button
            variant="contained"
            color="primary"
            endIcon={<Icon>search</Icon>}
            onClick={() => this.search()}
          >
            Search
          </Button>
        </div>
        {this.state.search_data.length > 0 && <SearchResults data={this.state.search_data} />}
      </div>
    );
  }
}

export const Search = withStyles(styles)(UnstyledSearch);