import { useState, useEffect } from 'react';
import { Container, TextField, Button, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox, Box, Paper, Typography, Snackbar, Alert, CircularProgress, IconButton, Tooltip } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { supabase } from './config/supabase';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

function App() {
  const [url, setUrl] = useState('');
  const [postLength, setPostLength] = useState('medium');
  const [useEmojis, setUseEmojis] = useState(false);
  const [tone, setTone] = useState('professional');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [posts, setPosts] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [isValidUrl, setIsValidUrl] = useState(true);
  const [characterCount, setCharacterCount] = useState(0);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!error) setPosts(data);
  };

  const generatePost = async () => {
    if (!url) {
      setError('Please enter a URL');
      setShowAlert(true);
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_MISTRAL_API_KEY}`
        },
        body: JSON.stringify({
          model: "mistral-tiny",
          messages: [{
            role: "user",
            content: `Create a LinkedIn post about the content from this URL: ${url}. 
                     Make it ${postLength} in length, ${useEmojis ? 'use' : "don't use"} emojis, 
                     and maintain a ${tone} tone.`
          }]
        })
      });

      const data = await response.json();
      setGeneratedContent(data.choices[0].message.content);
      
      // Save to Supabase
      await supabase.from('posts').insert({
        url,
        content: data.choices[0].message.content,
        post_length: postLength,
        tone,
        use_emojis: useEmojis
      });
      await fetchPosts();
    } catch (error) {
      setError('Failed to generate post. Please try again.');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const shareContent = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text: generatedContent });
      } else {
        await navigator.clipboard.writeText(generatedContent);
        setShowAlert(true);
        setError('Content copied to clipboard!');
      }
    } catch (error) {
      setError('Failed to share content');
      setShowAlert(true);
    }
  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleUrlChange = (e) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setIsValidUrl(validateUrl(newUrl));
  };

  
  // Add loading state for post deletion
  const [deletingId, setDeletingId] = useState(null);
  
  const deletePost = async (postId) => {
    try {
      setDeletingId(postId);
      await supabase.from('posts').delete().eq('id', postId);
      await fetchPosts();
      setShowAlert(true);
      setError('Post deleted successfully');
    } catch (error) {
      setShowAlert(true);
      setError('Failed to delete post');
    } finally {
      setDeletingId(null);
    }
  };
  
  useEffect(() => {
    setCharacterCount(generatedContent.length);
  }, [generatedContent]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setShowAlert(true);
      setError('Content copied to clipboard!');
    } catch (error) {
      setError('Failed to copy content');
      setShowAlert(true);
    }
  };

  // Single darkMode state with proper initialization
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Single theme creation with all customizations
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#0a66c2', // LinkedIn blue
      },
      secondary: {
        main: '#057642', // Professional green
      }
    },
    typography: {
      h4: {
        fontWeight: 600,
      }
    }
  });

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4">
                LinkedIn Post Generator
              </Typography>
              <IconButton onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Box>

            <TextField
              fullWidth
              label="Website URL"
              value={url}
              onChange={handleUrlChange}
              margin="normal"
              disabled={isLoading}
              error={!isValidUrl && url.length > 0}
              helperText={!isValidUrl && url.length > 0 ? 'Please enter a valid URL' : ''}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Post Length</InputLabel>
              <Select
                value={postLength}
                onChange={(e) => setPostLength(e.target.value)}
                label="Post Length"
                disabled={isLoading}
              >
                <MenuItem value="short">Short</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="long">Long</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Tone</InputLabel>
              <Select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                label="Tone"
                disabled={isLoading}
              >
                <MenuItem value="professional">Professional</MenuItem>
                <MenuItem value="casual">Casual</MenuItem>
                <MenuItem value="enthusiastic">Enthusiastic</MenuItem>
                <MenuItem value="formal">Formal</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={useEmojis}
                  onChange={(e) => setUseEmojis(e.target.checked)}
                  disabled={isLoading}
                />
              }
              label="Include emojis"
              sx={{ mt: 1 }}
            />

            <Button
              variant="contained"
              color="primary"
              onClick={generatePost}
              fullWidth
              sx={{ mt: 3 }}
              disabled={isLoading || !isValidUrl}
            >
              {isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                  Generating...
                </Box>
              ) : (
                'Generate Post'
              )}
            </Button>

            {generatedContent && (
              <Box sx={{ mt: 3 }}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Characters: {characterCount}
                    </Typography>
                    <Tooltip title="Copy to clipboard">
                      <IconButton onClick={() => copyToClipboard(generatedContent)} size="small">
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Typography variant="body1">
                    {generatedContent}
                  </Typography>
                  <Button
                    startIcon={<ShareIcon />}
                    onClick={shareContent}
                    variant="outlined"
                    sx={{ mt: 2 }}
                    fullWidth
                  >
                    Share
                  </Button>
                </Paper>
              </Box>
            )}

            {posts.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Recent Posts
                </Typography>
                {posts.map((post) => (
                  <Paper key={post.id} elevation={1} sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          URL: {post.url}
                        </Typography>
                        <Typography variant="body2">
                          {post.content}
                        </Typography>
                      </Box>
                      <IconButton 
                        onClick={() => deletePost(post.id)}
                        size="small"
                        color="error"
                        disabled={deletingId === post.id}
                      >
                        {deletingId === post.id ? (
                          <CircularProgress size={20} color="error" />
                        ) : (
                          <DeleteIcon />
                        )}
                      </IconButton>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}

            <Snackbar
              open={showAlert}
              autoHideDuration={6000}
              onClose={() => setShowAlert(false)}
            >
              <Alert
                onClose={() => setShowAlert(false)}
                severity={error.includes('clipboard') || error.includes('deleted') ? "success" : "error"}
                sx={{ width: '100%' }}
              >
                {error}
              </Alert>
            </Snackbar>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
