import React from "react"
import { Link } from "react-router-dom";
import { Grid, Paper, Typography, Icon, List, ListItem, ListItemAvatar, ListItemText, Avatar, CircularProgress }
  from "@material-ui/core"
import { withStyles, makeStyles } from '@material-ui/core/styles';
import ReactMarkdown from 'react-markdown'

import { ANILIST_BASE_URL, CHARACTERS_QUERY, STAFF_QUERY } from "../common";

const styles = theme => ({
  root: {
    flexGrow: 1,
  },
  mainPaper: {
    padding: theme.spacing(2),
  },
  item: {
    padding: theme.spacing(0.5),
  },
  itemImage: {
    display: 'block',
    maxWidth: '100%',
    maxHeight: '100%',
    margin: 'auto'
  },
  itemRight: {
    textAlign: 'right'
  }
});

const capitalizeWord = (word) => {
  if (word.length)
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  return word;
}

const CharacterItem = (props) => {
  const classes = makeStyles(styles)();

  return (
    <ListItem button divider={props.divider}>
      <Grid container>
        <Grid container item md={6} justify="flex-start" className={classes.item}>
          <Grid item xs={2} className={classes.item}>
            <img src={props.image} alt="character" className={classes.itemImage}/>
          </Grid>
          <Grid item xs={10} className={classes.item}>
            <Typography variant="body1">{props.name}</Typography>
            <Typography variant="body2">{props.role}</Typography>
            <div style={{ display: 'flex', alignItems: 'center'}}>
              <Icon fontSize="inherit">favoriteBorder</Icon>
              <Typography variant="body2">{props.favorites}</Typography>
            </div>
          </Grid>
        </Grid>
        <Grid container item md={6} justify="flex-end" className={classes.item} style={{textAlign: 'right'}}>
          <Grid item xs={10} className={classes.item}>
            <Typography variant="body1">{props.mediaTitle}</Typography>
            <Typography variant="body2">{props.mediaYear}</Typography>
            <Typography variant="body2">Score: {props.mediaScore}</Typography>
          </Grid>
          <Grid item xs={2} className={classes.item}>
            <img src={props.mediaImage} alt="media" className={classes.itemImage}/>
          </Grid>
        </Grid>
      </Grid>
    </ListItem>
  )
}

const CharacterList = (props) => {
  return (
    <List>
      {props.data.map((c, i) =>
        <CharacterItem key={c.id} role={c.role} image={c.image} name={c.name} favorites={c.favorites}
              mediaTitle={c.media_title} mediaScore={c.media_score} mediaYear={c.media_year} mediaImage={c.media_image}
              divider={i < props.data.length - 1} />
      )}
    </List>
  );
}

class UnstyledSeiyuu extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      id: this.props.match.params.id,
      name: 'Loading...',
      favorites: 0,
      image: '',
      description: 'Loading...',
      anilistUrl: '#',
      characters: []
    }
  }

  async fetchList() {
    const response = await fetch(ANILIST_BASE_URL , {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: CHARACTERS_QUERY,
        variables: {
          id: parseInt(this.state.id),
          page: 1,
          perPage: 5
        }
      })
    });
    const reply = await response.json();
    console.log(reply);
    const data = reply['data']['Staff']
    console.assert(data['id'] == this.state.id);
    const characters = data['characters']['edges'].map(e => (
      {
        id: e['node']['id'],
        role: capitalizeWord(e['role']),
        favorites: e['node']['favourites'],
        image: e['node']['image']['medium'],
        name: e['node']['name']['full'],
        media_score: e['node']['media']['nodes'][0]['averageScore'],
        media_title: e['node']['media']['nodes'][0]['title']['romaji'],
        media_year: e['node']['media']['nodes'][0]['seasonYear'],
        media_image: e['node']['media']['nodes'][0]['coverImage']['medium']
      }
    ));
    this.setState({ characters });
    console.log(this.state);
  }
  async componentDidMount() {
    const promise = await fetch(ANILIST_BASE_URL , {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: STAFF_QUERY,
        variables: {
          id: parseInt(this.state.id),
        }
      })
    });
    const [response, _] = await Promise.all([promise, this.fetchList()]);
    const reply = await response.json();
    console.log(reply);
    const data = reply['data']['Staff']
    this.setState({
      id: data['id'],
      name: data['name']['full'],
      favorites: data['favourites'],
      image: data['image']['large'],
      description: data['description'],
      anilistUrl: data['siteUrl']
    })
  }

  render() {
    const classes = this.props.classes;
    return (
      <div className={classes.root}>
        <Grid container spacing={2}>
          <Grid item md={3}>
            <Paper className={classes.mainPaper}>
              <img src={this.state.image} width="100%" alt="Seiyuu"/>

              <Typography variant="h4">{this.state.name}</Typography>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Icon fontSize="small">favoriteBorder</Icon> &nbsp;
                <Typography variant="body2">{this.state.favorites}</Typography>
              </div>

              <ReactMarkdown source={this.state.description} />
            </Paper>
          </Grid>
          <Grid item md={9}>
            <Paper className={classes.mainPaper}>
              {this.state.characters.length > 0 ? <CharacterList data={this.state.characters} /> : <CircularProgress />}
            </Paper>
          </Grid>
        </Grid>
      </div>
    )
  }
}

export const Seiyuu = withStyles(styles)(UnstyledSeiyuu);