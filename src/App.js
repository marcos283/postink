import React, { useState, useEffect } from 'react';
import { Container, TextField, Button, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox, Typography, Box, Paper, IconButton, Tooltip, Snackbar, Alert, CircularProgress } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ShareIcon from '@mui/icons-material/Share';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';

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
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

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
      const promptText = `Analiza esta URL: ${url} y crea una publicación para LinkedIn en español de España.
                     IMPORTANTE: Si no puedes acceder al contenido de la URL, responde ÚNICAMENTE Y EXACTAMENTE con: "ERROR: No se puede acceder al contenido de la URL."
                     NO generes contenido alternativo ni sugerencias si no puedes acceder a la URL.
                     DEBES basar la publicación EXCLUSIVAMENTE en el contenido real de la URL, sin añadir información inventada.

                     Instrucciones específicas según el tono seleccionado:
                     - Si el tono es 'analytical': Utiliza un lenguaje técnico y objetivo. Enfócate en datos, métricas y análisis. Evita expresiones coloquiales y emocionales. Estructura el contenido de manera sistemática.
                     - Si el tono es 'professional': Mantén un equilibrio entre formalidad y accesibilidad. Usa términos técnicos cuando sea necesario pero mantén la claridad.
                     - Si el tono es 'formal': Utiliza un lenguaje estrictamente formal y estructurado. Evita cualquier coloquialismo.
                     - Si el tono es 'informative': Prioriza la claridad y la transmisión efectiva de información. Mantén un tono neutral y didáctico.

                     Longitud: ${postLength}
                     Tono: ${tone}
                     ${useEmojis ? 'Incluye emojis relevantes y profesionales' : 'No incluyas emojis'}
                     Utiliza expresiones y vocabulario propios de España.
                     El post debe terminar con una línea en blanco seguida de "Más información: ${url}"`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.REACT_APP_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: promptText
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid API response format');
      }
      
      const content = data.candidates[0].content.parts[0].text;
      setGeneratedContent(content);
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
      setError('¡Post copiado al portapapeles!');
      setShowAlert(true);
    } catch (err) {
      setError('No se pudo copiar el post');
      setShowAlert(true);
    }
  };

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#0a66c2', // LinkedIn blue
      },
      background: {
        default: darkMode ? '#1a1a1a' : '#f3f2ef', // Color de fondo de LinkedIn
        paper: darkMode ? '#2d2d2d' : '#ffffff',
      }
    },
    typography: {
      h4: {
        fontWeight: 700,
      }
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          }
        }
      }
    }
  });

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
            {/* Encabezado */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 4,
              borderBottom: 1,
              borderColor: 'divider',
              pb: 2
            }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                LinkedIn Post Generator
              </Typography>
              <IconButton onClick={() => setDarkMode(!darkMode)} sx={{ ml: 2 }}>
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Box>

            {/* Panel de Configuración */}
            <Box sx={{ 
              display: 'grid', 
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              mb: 4 
            }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  label="URL del sitio web"
                  value={url}
                  onChange={handleUrlChange}
                  margin="normal"
                  disabled={isLoading}
                  error={!isValidUrl && url.length > 0}
                  helperText={!isValidUrl && url.length > 0 ? 'Por favor, ingresa una URL válida' : ''}
                  sx={{ mb: 0 }}
                />
                <IconButton 
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      setUrl(text);
                      setIsValidUrl(validateUrl(text));
                    } catch (err) {
                      setError('No se pudo pegar desde el portapapeles');
                      setShowAlert(true);
                    }
                  }}
                  sx={{ mt: 2 }}
                  disabled={isLoading}
                >
                  <ContentPasteIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Opciones de Generación */}
            <Box sx={{ 
              display: 'grid', 
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
              mb: 3 
            }}>
              <FormControl fullWidth>
                <InputLabel>Longitud</InputLabel>
                <Select
                  value={postLength}
                  onChange={(e) => setPostLength(e.target.value)}
                  label="Longitud"
                  disabled={isLoading}
                >
                  <MenuItem value="short">Corto</MenuItem>
                  <MenuItem value="medium">Medio</MenuItem>
                  <MenuItem value="long">Largo</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Tono</InputLabel>
                <Select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  label="Tono"
                  disabled={isLoading}
                >
                  <MenuItem value="professional">Profesional</MenuItem>
                  <MenuItem value="formal">Formal</MenuItem>
                  <MenuItem value="informative">Informativo</MenuItem>
                  <MenuItem value="analytical">Analítico</MenuItem>
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
                label="Incluir emojis"
                sx={{ mt: 1 }}
              />
            </Box>

            {/* Botón de Generación */}
            <Button
              variant="contained"
              color="primary"
              onClick={generatePost}
              fullWidth
              sx={{ 
                mt: 2, 
                mb: 4, 
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}
              disabled={isLoading || !isValidUrl}
            >
              {isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                  Generando...
                </Box>
              ) : (
                'Generar Post'
              )}
            </Button>

            {/* Contenido Generado */}
            {generatedContent && (
                <Box sx={{ mt: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Contenido Generado
                    </Typography>
                    <Box>
                      <Tooltip title="Copiar al portapapeles">
                        <IconButton 
                          onClick={() => copyToClipboard(generatedContent)}
                          size="small"
                          sx={{ mr: 1 }}
                        >
                          <ContentCopyIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Compartir">
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

              <Snackbar
                open={showAlert}
                autoHideDuration={6000}
                onClose={() => setShowAlert(false)}
              >
                <Alert
                  onClose={() => setShowAlert(false)}
                  severity={error.includes('clipboard') ? "success" : "error"}
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
