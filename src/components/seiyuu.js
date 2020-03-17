import React from "react"
import { Grid, Paper, Typography, Icon, List, ListItem, CircularProgress }
  from "@material-ui/core"
import { withStyles, makeStyles } from '@material-ui/core/styles';
import ReactMarkdown from 'react-markdown'

import { ANILIST_BASE_URL, CHARACTERS_QUERY, STAFF_QUERY } from "../common";

const styles = theme => ({
  root: {
    flexGrow: 1,
  },
  descPaper: {
    padding: theme.spacing(2),
  },
  listPaper: {
    padding: theme.spacing(1),
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
  },
  centerFlex: {
    display: 'flex',
    alignItems: 'center'
  },
  markdownContainer: {
    fontSize: '0.875rem'
  },
  listLoader: {
    display: 'flex',
    justifyContent: 'center',
    height: '100%',
    alignItems: 'center',
  }
});

const capitalizeWord = (word) => {
  if (word.length)
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  return word;
}

const SeiyuuDescription = (props) => {
  const classes = makeStyles(styles)();

  return (
    <>
      <img src={props.image} width="100%" alt="Seiyuu"/>

      <Typography variant="h4">{props.name}</Typography>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Icon fontSize="small">favorite</Icon> &nbsp;
        <Typography variant="body2">{props.favorites}</Typography>
      </div>

      <div className={classes.markdownContainer}>
        <ReactMarkdown source={props.description} />
      </div>
    </>)
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
            <div className={classes.centerFlex}>
              <Icon style={{fontSize: "0.875rem"}}>favoriteBorder</Icon> &nbsp;
              <Typography variant="body2" style={{fontSize: "0.875rem"}}>{props.favorites}</Typography>
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
      characters: [],
      is_loading_desc: true,
    };
  }

  async fetchList(page) {
    console.log(`Fetching page ${page}`);
    const response = await fetch(ANILIST_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: CHARACTERS_QUERY,
        variables: {
          id: parseInt(this.state.id),
          page: page,
          perPage: 50
        }
      })
    });
    const reply = await response.json();
    console.log(`Fetched page ${page}`);
    console.log(reply);
    const data = reply['data']['Staff']
    console.assert(data['id'] === this.state.id);
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
    return characters;
  }

  async fetchFullList(total_pages) {
    console.log(`Fetching ${total_pages} pages`);
    const promises = [];
    for (let page = 1; page <= total_pages; ++page) {
      promises.push(this.fetchList(page));
    }
    const character_lists = await Promise.all(promises);
    const characters = [].concat.apply([], character_lists);

    this.setState({ characters });
    console.log(this.state);
  }

  async fetchStaff() {
    const response = await fetch(ANILIST_BASE_URL , {
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
    const reply = await response.json();
    console.log(reply);
    const data = reply['data']['Staff'];
    this.setState({
      id: data['id'],
      name: data['name']['full'],
      favorites: data['favourites'],
      image: data['image']['large'],
      description: data['description'],
      anilistUrl: data['siteUrl'],
      is_loading_desc: false,
    });
    
    let total_pages = data['characters']['pageInfo']['lastPage'];
    await this.fetchFullList(total_pages);
  }

  componentDidMount() {
    this.fetchStaff()
  }

  render() {
    const classes = this.props.classes;
    return (
      <div className={classes.root}>
        <Grid container spacing={2}>
          <Grid item md={3}>
            {this.state.is_loading_desc ||
              <Paper className={classes.descPaper}>
                <SeiyuuDescription image={this.state.image} name={this.state.name}
                  favorites={this.state.favorites} description={this.state.description}/>
              </Paper>}
          </Grid>
          <Grid item md={9}>
              {this.state.characters.length > 0 ?
                <Paper className={classes.listPaper}><CharacterList data={this.state.characters} /></Paper> :
              <div className={classes.listLoader}><CircularProgress size={60} thickness={4}/></div>}
          </Grid>
        </Grid>
      </div>
    )
  }
}

export const Seiyuu = withStyles(styles)(UnstyledSeiyuu);