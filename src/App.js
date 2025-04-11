import React, { useState, useEffect } from 'react';
import { Container, TextField, Button, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox, Typography, Box, Paper, Chip, IconButton, Tooltip, Snackbar, Alert, CircularProgress } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from './supabaseClient';
// First add the ShareIcon import at the top with other imports
import ShareIcon from '@mui/icons-material/Share';

function App() {
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(true);
  const [postLength, setPostLength] = useState('medium');
  const [tone, setTone] = useState('professional');
  const [useEmojis, setUseEmojis] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [posts, setPosts] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      console.log('Fetching posts');
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to fetch posts');
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

  const generatePost = async () => {
    if (!url) {
      setError('Please enter a URL');
      setShowAlert(true);
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      console.log('Generating post with URL:', url);
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
            content: `Crea una publicación para LinkedIn en español de España sobre el contenido de esta URL: ${url}. 
                     Que sea de longitud ${postLength}, ${useEmojis ? 'utiliza' : "no utilices"} emojis, 
                     y mantén un tono ${tone}. Utiliza expresiones y vocabulario propios de España.
                     El post debe terminar con una línea en blanco seguida de "Más información: ${url}"`
          }]
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format');
      }

      const content = data.choices[0].message.content;
      setGeneratedContent(content);

      // Removed the code that stores the post in Supabase
      // await supabase.from('posts').insert({
      //   url,
      //   content,
      //   post_length: postLength,
      //   tone,
      //   use_emojis: useEmojis
      // });

      await fetchPosts();
    } catch (error) {
      console.error('Error generating post:', error);
      if (error.name === 'AbortError') {
        setError('La generación del post ha tardado demasiado. Por favor, inténtalo de nuevo.');
      } else {
        setError('Error al generar el post. Por favor, inténtalo de nuevo.');
      }
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setError('Post copied to clipboard!');
      setShowAlert(true);
    } catch (err) {
      setError('Failed to copy post');
      setShowAlert(true);
    }
  };

  const deletePost = async (id) => {
    try {
      setDeletingId(id);
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setPosts(posts.filter(post => post.id !== id));
      setError('Post deleted successfully!');
      setShowAlert(true);
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('Failed to delete post');
      setShowAlert(true);
    } finally {
      setDeletingId(null);
    }
  };

  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#0a66c2',
      },
      background: {
        default: darkMode ? '#121212' : '#f5f7fa',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
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

              {/* Display the generated content */}
              {generatedContent && (
                <Box sx={{ mt: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Generated Content
                    </Typography>
                    <Box>
                      <Tooltip title="Copy to clipboard">
                        <IconButton 
                          onClick={() => copyToClipboard(generatedContent)}
                          size="small"
                          sx={{ mr: 1 }}
                        >
                          <ContentCopyIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Share">
                        <IconButton 
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: 'LinkedIn Post',
                                text: generatedContent
                              }).catch(err => {
                                setError('Sharing failed');
                                setShowAlert(true);
                              });
                            } else {
                              copyToClipboard(generatedContent);
                              setError('Copied to clipboard (share not supported)');
                              setShowAlert(true);
                            }
                          }}
                          size="small"
                        >
                          <ShareIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                    {generatedContent}
                  </Typography>
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
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="caption" color="textSecondary">
                              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es })}
                            </Typography>
                            <Box>
                              <Chip size="small" label={post.post_length} sx={{ mr: 1 }} />
                              <Chip size="small" label={post.tone} />
                              {post.use_emojis && <Chip size="small" label="Emojis" sx={{ ml: 1 }} />}
                            </Box>
                          </Box>
                          <Typography variant="caption" color="textSecondary" display="block">
                            URL: {post.url}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {post.content}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Tooltip title="Copy to clipboard">
                              <IconButton onClick={() => copyToClipboard(post.content)} size="small" sx={{ mr: 1 }}>
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
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
                        </Box>
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
